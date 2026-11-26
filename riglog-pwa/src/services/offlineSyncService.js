import { apiClient } from '../config/api'

// ---------------------------------------------------------------------------
// OfflineSyncService — Persistent Disk Cache & Offline Outbox Queue (IndexedDB + localStorage)
// Menyimpan penambahan/perubahan produk & stok secara lokal saat tidak ada koneksi internet,
// tetap bertahan setelah refresh browser (offline), dan otomatis sinkron ke Express API / Neon DB
// begitu koneksi internet kembali tersambung.
// ---------------------------------------------------------------------------

const IDB_NAME = 'riglog_offline_db'
const IDB_VERSION = 1
const IDB_STORE = 'kv'

const LS_QUEUE_KEY = 'riglog_offline_queue_v1'
const LS_PRODUCTS_KEY = 'riglog_offline_products_cache_v2'
const LS_LOGS_KEY = 'riglog_offline_logs_cache_v2'

let memoryQueue = null
let memoryProducts = null
let memoryLogs = null
let syncInProgress = false
let idbPromise = null

const openDB = () => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (idbPromise) return idbPromise
  idbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return idbPromise
}

const idbGet = async (key) => {
  const db = await openDB()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

const idbSet = async (key, value) => {
  const db = await openDB()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

const safeReadLS = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const safeWriteLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Jika ukuran gambar base64 melebihi 5MB localStorage, data tetap aman di IndexedDB
  }
}

export const getOfflineQueue = () => {
  if (Array.isArray(memoryQueue)) return memoryQueue
  const fromLs = safeReadLS(LS_QUEUE_KEY)
  memoryQueue = Array.isArray(fromLs) ? fromLs : []
  return memoryQueue
}

const persistQueue = async (nextQueue) => {
  memoryQueue = Array.isArray(nextQueue) ? nextQueue : []
  safeWriteLS(LS_QUEUE_KEY, memoryQueue)
  await idbSet('sync_queue', memoryQueue)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('riglog-offline-queue-changed', {
        detail: { count: memoryQueue.length },
      }),
    )
  }
}

export const getPendingSyncCount = () => getOfflineQueue().length

export const getDiskCachedProducts = () => {
  if (Array.isArray(memoryProducts) && memoryProducts.length > 0) {
    return memoryProducts
  }
  const fromLs = safeReadLS(LS_PRODUCTS_KEY)
  if (Array.isArray(fromLs) && fromLs.length > 0) {
    memoryProducts = fromLs
    return memoryProducts
  }
  return null
}

export const setDiskCachedProducts = (products) => {
  if (!Array.isArray(products)) return
  memoryProducts = products
  safeWriteLS(LS_PRODUCTS_KEY, products)
  void idbSet('products_cache', products)
}

export const getDiskCachedLogs = () => {
  if (Array.isArray(memoryLogs) && memoryLogs.length > 0) {
    return memoryLogs
  }
  const fromLs = safeReadLS(LS_LOGS_KEY)
  if (Array.isArray(fromLs) && fromLs.length > 0) {
    memoryLogs = fromLs
    return memoryLogs
  }
  return null
}

export const setDiskCachedLogs = (logs) => {
  if (!Array.isArray(logs)) return
  memoryLogs = logs
  safeWriteLS(LS_LOGS_KEY, logs)
  void idbSet('logs_cache', logs)
}

/**
 * Muat ulang data IndexedDB saat aplikasi boot (terutama setelah refresh dalam mode offline
 * jika ukuran foto melebihi batas kuota localStorage).
 */
export const hydrateOfflineStore = async () => {
  let updated = false

  const idbQueue = await idbGet('sync_queue')
  if (Array.isArray(idbQueue) && idbQueue.length > 0) {
    const current = getOfflineQueue()
    const mergedMap = new Map()
    idbQueue.forEach((op) => mergedMap.set(op.opId, op))
    current.forEach((op) => mergedMap.set(op.opId, op))
    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
    )
    if (merged.length !== current.length) {
      memoryQueue = merged
      safeWriteLS(LS_QUEUE_KEY, merged)
      updated = true
    }
  }

  const idbProds = await idbGet('products_cache')
  if (Array.isArray(idbProds) && idbProds.length > 0) {
    if (!memoryProducts || memoryProducts.length === 0) {
      memoryProducts = idbProds
      updated = true
    }
  }

  const idbLogs = await idbGet('logs_cache')
  if (Array.isArray(idbLogs) && idbLogs.length > 0) {
    if (!memoryLogs || memoryLogs.length === 0) {
      memoryLogs = idbLogs
      updated = true
    }
  }

  if (updated && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('riglog-offline-hydrated'))
    window.dispatchEvent(
      new CustomEvent('riglog-offline-queue-changed', {
        detail: { count: getPendingSyncCount() },
      }),
    )
  }

  return {
    pendingCount: getPendingSyncCount(),
    hasCachedProducts: Boolean(memoryProducts && memoryProducts.length > 0),
  }
}

/**
 * Tambahkan operasi baru ke antrean offline di disk (IndexedDB + localStorage).
 */
export const enqueueOfflineOperation = async (operation) => {
  const queue = [...getOfflineQueue()]
  const entry = {
    opId: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...operation,
  }

  // Jika mengedit produk yang masih berada di antrean CREATE_PRODUCT (belum sync), gabungkan langsung
  if (entry.type === 'UPDATE_PRODUCT') {
    const existingCreateIdx = queue.findIndex(
      (q) =>
        q.type === 'CREATE_PRODUCT' &&
        String(q.tempId) === String(entry.productId),
    )
    if (existingCreateIdx !== -1) {
      queue[existingCreateIdx] = {
        ...queue[existingCreateIdx],
        payload: {
          ...queue[existingCreateIdx].payload,
          ...entry.payload,
        },
      }
      await persistQueue(queue)
      return queue[existingCreateIdx]
    }
  }

  queue.push(entry)
  await persistQueue(queue)
  return entry
}

/**
 * Gabungkan antrean offline (produk baru, edit, & mutasi stok) ke daftar produk yang tampil di UI.
 * Memastikan setelah browser di-refresh dalam kondisi offline, produk baru tetap muncul di Katalog!
 */
export const mergePendingQueueIntoProducts = (baseProducts = []) => {
  const queue = getOfflineQueue()
  if (queue.length === 0) return baseProducts

  let list = baseProducts.map((p) => ({ ...p }))

  for (const op of queue) {
    if (op.type === 'CREATE_PRODUCT') {
      const alreadyExists = list.some(
        (p) =>
          String(p.id) === String(op.tempId) ||
          (op.payload?.sku && String(p.sku) === String(op.payload.sku)),
      )
      if (!alreadyExists) {
        list.unshift({
          ...op.payload,
          id: op.tempId,
          pendingSync: true,
          created_at: new Date(op.createdAt || Date.now()).toISOString(),
        })
      }
    } else if (op.type === 'UPDATE_PRODUCT') {
      list = list.map((p) =>
        String(p.id) === String(op.productId)
          ? { ...p, ...op.payload, pendingSync: true }
          : p,
      )
    } else if (op.type === 'CREATE_STOCK_LOG') {
      const pid = op.payload?.product_id
      const qty = Math.max(1, Number(op.payload?.quantity || 1))
      const mType = String(op.payload?.type || 'IN').toUpperCase()
      list = list.map((p) => {
        if (String(p.id) !== String(pid)) return p
        const prevStock = Number(p.stock ?? 0)
        const nextStock =
          mType === 'IN'
            ? prevStock + qty
            : mType === 'OUT'
              ? Math.max(0, prevStock - qty)
              : qty
        return { ...p, stock: nextStock, pendingSync: true }
      })
    }
  }

  return list
}

/**
 * Gabungkan log offline (termasuk auto-log produk baru & mutasi stok offline) ke daftar Stok Log.
 */
export const mergePendingQueueIntoLogs = (baseLogs = []) => {
  const queue = getOfflineQueue()
  if (queue.length === 0) return baseLogs

  const extraLogs = []
  for (const op of queue) {
    if (op.type === 'CREATE_PRODUCT' && Number(op.payload?.stock ?? 0) > 0) {
      extraLogs.push({
        id: `offline-log-${op.opId}`,
        product_id: op.tempId,
        product_name: op.payload.name,
        sku: op.payload.sku,
        type: 'IN',
        quantity: Number(op.payload.stock),
        previous_stock: 0,
        current_stock: Number(op.payload.stock),
        reference_no: `OFFLINE-${String(op.createdAt).slice(-5)}`,
        operator: op.payload.operator || 'Admin Gudang (Offline)',
        supplier_name: 'Registrasi Komponen Baru (Offline)',
        notes: `Menunggu sinkronisasi ke server — "${op.payload.name}"`,
        created_at: new Date(op.createdAt || Date.now()).toISOString(),
        pendingSync: true,
      })
    } else if (op.type === 'CREATE_STOCK_LOG') {
      const prevStock = Number(op.payload?.previous_stock ?? 0)
      const qty = Math.max(1, Number(op.payload?.quantity ?? 1))
      const mType = String(op.payload?.type || 'IN').toUpperCase()
      const nextStock =
        mType === 'IN'
          ? prevStock + qty
          : mType === 'OUT'
            ? Math.max(0, prevStock - qty)
            : qty
      extraLogs.push({
        id: op.tempLogId || `offline-log-${op.opId}`,
        product_id: op.payload.product_id,
        product_name: op.payload.product_name || 'Komponen',
        sku: op.payload.sku || 'SKU',
        type: mType,
        quantity: qty,
        previous_stock: prevStock,
        current_stock: nextStock,
        reference_no:
          op.payload.reference_no || `OFFLINE-${String(op.createdAt).slice(-5)}`,
        operator: op.payload.operator || 'Admin Gudang (Offline)',
        supplier_name: op.payload.supplier_name || 'Mutasi Offline',
        notes: op.payload.notes || 'Menunggu sinkronisasi ke server',
        created_at: new Date(op.createdAt || Date.now()).toISOString(),
        pendingSync: true,
      })
    }
  }

  return [...extraLogs.reverse(), ...baseLogs]
}

/**
 * Sinkronkan seluruh antrean offline ke Express API (Neon PostgreSQL) secara berurutan (FIFO)
 * saat koneksi internet sudah kembali online.
 */
export const syncPendingOfflineQueue = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, remaining: getPendingSyncCount(), offline: true }
  }
  if (syncInProgress) {
    return { syncedCount: 0, remaining: getPendingSyncCount(), busy: true }
  }

  // Pastikan antrean dari IndexedDB sudah terhidrasi penuh sebelum sinkronisasi
  await hydrateOfflineStore()
  const queue = [...getOfflineQueue()]
  if (queue.length === 0) {
    return { syncedCount: 0, remaining: 0 }
  }

  syncInProgress = true
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('riglog-offline-sync-start', {
        detail: { count: queue.length },
      }),
    )
  }

  let syncedCount = 0
  let authError = null
  const remaining = []
  const tempIdToRealId = new Map()

  try {
    for (let i = 0; i < queue.length; i++) {
      const op = queue[i]
      try {
        if (op.type === 'CREATE_PRODUCT') {
          const res = await apiClient.post('/api/products', op.payload)
          const created = res?.data || res
          if (created?.id && op.tempId) {
            tempIdToRealId.set(String(op.tempId), created.id)
          }
          syncedCount++
        } else if (op.type === 'UPDATE_PRODUCT') {
          const targetId =
            tempIdToRealId.get(String(op.productId)) || op.productId
          await apiClient.put(`/api/products/${targetId}`, op.payload)
          syncedCount++
        } else if (op.type === 'CREATE_STOCK_LOG') {
          const mappedProductId =
            tempIdToRealId.get(String(op.payload?.product_id)) ||
            op.payload?.product_id
          await apiClient.post('/api/stock-logs', {
            ...op.payload,
            product_id: mappedProductId,
          })
          syncedCount++
        }
      } catch (err) {
        // Jika jaringan belum stabil saat baru connect Wi-Fi, hentikan & simpan sisa antrean untuk retry
        if (err?.isNetworkError || !navigator.onLine) {
          remaining.push(...queue.slice(i))
          break
        }
        // Jika token admin habis (401/403), simpan antrean & beri tahu admin
        if (err?.status === 401 || err?.status === 403) {
          authError =
            err.message ||
            'Sesi Admin kedaluwarsa. Login ulang di Profil untuk menyinkronkan data offline.'
          remaining.push(...queue.slice(i))
          break
        }
        // Jika SKU ternyata sudah masuk dari percobaan sebelumnya (duplicate key), anggap selesai
        const msg = String(err?.message || '').toLowerCase()
        if (
          op.type === 'CREATE_PRODUCT' &&
          (msg.includes('duplicate') || msg.includes('unique'))
        ) {
          syncedCount++
          continue
        }
        // Error validasi lain: simpan agar tidak hilang diam-diam, lanjut item berikutnya
        remaining.push(op)
      }
    }

    await persistQueue(remaining)

    if (syncedCount > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('riglog-offline-synced', {
          detail: { syncedCount, remaining: remaining.length },
        }),
      )
    }
    if (authError && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('riglog-offline-sync-error', {
          detail: { message: authError },
        }),
      )
    }

    return { syncedCount, remaining: remaining.length, authError }
  } finally {
    syncInProgress = false
  }
}

export default {
  hydrateOfflineStore,
  getOfflineQueue,
  getPendingSyncCount,
  getDiskCachedProducts,
  setDiskCachedProducts,
  getDiskCachedLogs,
  setDiskCachedLogs,
  enqueueOfflineOperation,
  mergePendingQueueIntoProducts,
  mergePendingQueueIntoLogs,
  syncPendingOfflineQueue,
}
