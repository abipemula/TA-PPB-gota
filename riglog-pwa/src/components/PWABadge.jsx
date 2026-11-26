import { useState, useEffect } from 'react'
import {
  Download,
  WifiOff,
  X,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  CloudUpload,
  AlertTriangle,
} from 'lucide-react'
import {
  getPendingSyncCount,
  syncPendingOfflineQueue,
} from '../services/offlineSyncService'

/**
 * PWABadge — Tombol Install PWA permanen di pojok kanan bawah + indikator status offline & auto-sync.
 * Menampilkan status antrean offline di disk dan notifikasi otomatis ketika data tersinkronisasi ke server.
 */
export default function PWABadge() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingCount, setPendingCount] = useState(() => getPendingSyncCount())
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncDoneMsg, setSyncDoneMsg] = useState('')
  const [syncErrorMsg, setSyncErrorMsg] = useState('')
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  })
  const [showGuideModal, setShowGuideModal] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const handleAppInstalled = () => {
      setIsStandalone(true)
      setInstallPrompt(null)
      setShowGuideModal(false)
    }
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    const handleQueueChanged = () => setPendingCount(getPendingSyncCount())
    const handleSyncStart = () => {
      setIsSyncing(true)
      setSyncErrorMsg('')
    }
    const handleSynced = (e) => {
      setIsSyncing(false)
      setPendingCount(getPendingSyncCount())
      const count = e?.detail?.syncedCount || 1
      setSyncDoneMsg(
        `${count} data offline berhasil disinkronkan ke server Neon!`,
      )
      setTimeout(() => setSyncDoneMsg(''), 6500)
    }
    const handleSyncError = (e) => {
      setIsSyncing(false)
      setPendingCount(getPendingSyncCount())
      setSyncErrorMsg(e?.detail?.message || 'Sinkronisasi offline tertunda.')
      setTimeout(() => setSyncErrorMsg(''), 7000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('riglog-offline-queue-changed', handleQueueChanged)
    window.addEventListener('riglog-offline-hydrated', handleQueueChanged)
    window.addEventListener('riglog-offline-sync-start', handleSyncStart)
    window.addEventListener('riglog-offline-synced', handleSynced)
    window.addEventListener('riglog-offline-sync-error', handleSyncError)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(
        'riglog-offline-queue-changed',
        handleQueueChanged,
      )
      window.removeEventListener('riglog-offline-hydrated', handleQueueChanged)
      window.removeEventListener('riglog-offline-sync-start', handleSyncStart)
      window.removeEventListener('riglog-offline-synced', handleSynced)
      window.removeEventListener('riglog-offline-sync-error', handleSyncError)
    }
  }, [])

  const handleManualSync = async () => {
    setIsSyncing(true)
    await syncPendingOfflineQueue()
    setIsSyncing(false)
    setPendingCount(getPendingSyncCount())
  }

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setIsStandalone(true)
      }
      setInstallPrompt(null)
      return
    }
    setShowGuideModal(true)
  }

  return (
    <>
      {isOffline && (
        <aside
          className="pwa-offline-bar"
          role="status"
          aria-live="polite"
        >
          <WifiOff size={15} />
          <span>
            Mode Offline —{' '}
            {pendingCount > 0
              ? `${pendingCount} data disimpan di cache disk (auto-sync saat online).`
              : 'Data baru disimpan di cache disk & otomatis sinkron saat online.'}
          </span>
        </aside>
      )}

      {!isOffline && (isSyncing || pendingCount > 0) && (
        <aside
          className="pwa-offline-bar pwa-sync-bar--syncing"
          role="status"
          aria-live="polite"
        >
          {isSyncing ? (
            <>
              <RefreshCw size={15} className="spin" />
              <span>Menyinkronkan {pendingCount || 1} data offline ke server…</span>
            </>
          ) : (
            <>
              <CloudUpload size={15} />
              <span>{pendingCount} data offline siap disinkronkan</span>
              <button
                type="button"
                className="pwa-sync-now-btn"
                onClick={handleManualSync}
              >
                Sync Sekarang
              </button>
            </>
          )}
        </aside>
      )}

      {!isOffline && !isSyncing && pendingCount === 0 && syncDoneMsg && (
        <aside
          className="pwa-offline-bar pwa-sync-bar--success"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={15} />
          <span>{syncDoneMsg}</span>
        </aside>
      )}

      {!isOffline && syncErrorMsg && (
        <aside
          className="pwa-offline-bar"
          role="alert"
        >
          <AlertTriangle size={15} />
          <span>{syncErrorMsg}</span>
        </aside>
      )}

      {/* Opsi Install App permanen di pojok kanan bawah (di atas BottomNav) */}
      {!isStandalone && (
        <button
          type="button"
          className="pwa-fab-install"
          onClick={handleInstallClick}
          title="Install Aplikasi RigLog ke perangkat"
          aria-label="Install Aplikasi RigLog"
        >
          <Download size={17} />
          <span>Install App</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={22} color="#ec1c24" />
                <h3 className="modal-title display" style={{ margin: 0 }}>
                  Cara Install RigLog PWA
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowGuideModal(false)}
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>
            <p className="modal-msg" style={{ marginBottom: '6px' }}>
              Jika dialog install otomatis belum muncul pada browser Anda, pasang secara manual dengan langkah berikut:
            </p>
            <ol className="detail-steps" style={{ fontSize: '0.86rem', marginBottom: '12px' }}>
              <li>
                <strong>Chrome / Edge Desktop:</strong> Klik ikon <em>Install</em> (layar dengan panah bawah) di ujung kanan address bar, atau klik menu <strong>⋮ → Cast, save, and share → Install RigLog</strong>.
              </li>
              <li>
                <strong>Android (Chrome):</strong> Ketuk menu <strong>⋮</strong> di pojok kanan atas → pilih <strong>Add to Home Screen / Install App</strong>.
              </li>
              <li>
                <strong>iPhone (Safari):</strong> Ketuk tombol <strong>Share</strong> → pilih <strong>Add to Home Screen</strong>.
              </li>
            </ol>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn--confirm"
                onClick={() => setShowGuideModal(false)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
