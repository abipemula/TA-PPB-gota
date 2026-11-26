import { isPostgresConfigured, pgPool, ensurePostgresReady } from "../config/db.js";
import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";

/**
 * Helper internal: catat log stok otomatis saat komponen baru dibuat
 * atau saat jumlah stok berubah lewat edit produk.
 */
async function insertAutoStockLog(logRecord) {
  if (isPostgresConfigured) {
    await ensurePostgresReady();
    await pgPool.query(
      `INSERT INTO stock_logs (
        product_id, product_name, sku, type, quantity, previous_stock,
        current_stock, reference_no, operator, supplier_name, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        logRecord.product_id,
        logRecord.product_name,
        logRecord.sku,
        logRecord.type,
        logRecord.quantity,
        logRecord.previous_stock,
        logRecord.current_stock,
        logRecord.reference_no,
        logRecord.operator,
        logRecord.supplier_name,
        logRecord.notes,
      ]
    );
    return;
  }

  if (isSupabaseConfigured) {
    await supabase.from("stock_logs").insert([logRecord]);
    return;
  }

  memoryStore.stock_logs.unshift({
    id: memoryStore.genId(),
    ...logRecord,
    created_at: new Date().toISOString(),
  });
  saveMemoryStore();
}

export const ProductModel = {
  async getAll(filters = {}) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const conditions = [];
      const values = [];

      if (filters.category && filters.category !== "All") {
        values.push(filters.category);
        conditions.push(`LOWER(category_name) = LOWER($${values.length})`);
      }
      if (filters.search) {
        values.push(`%${filters.search}%`);
        conditions.push(
          `(name ILIKE $${values.length} OR sku ILIKE $${values.length} OR brand ILIKE $${values.length})`
        );
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const { rows } = await pgPool.query(
        `SELECT * FROM products ${whereClause} ORDER BY created_at DESC`,
        values
      );
      return rows;
    }

    if (isSupabaseConfigured) {
      let query = supabase
        .from("products")
        .select("*, categories ( id, name )");
      if (filters.category && filters.category !== "All") {
        query = query.eq("category_name", filters.category);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      return data;
    }

    let list = [...memoryStore.products];
    if (filters.category && filters.category !== "All") {
      list = list.filter(
        (p) =>
          (p.category_name || "").toLowerCase() ===
          filters.category.toLowerCase()
      );
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getById(id) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        "SELECT * FROM products WHERE id = $1 LIMIT 1",
        [id]
      );
      if (!rows[0]) throw new Error("Product not found");
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories ( id, name )")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    }

    const found = memoryStore.products.find((p) => String(p.id) === String(id));
    if (!found) throw new Error("Product not found");
    return found;
  },

  async create(payload) {
    const sku = payload.sku || `SKU-${Date.now().toString().slice(-5)}`;
    const initialStock = Number(payload.stock ?? 0);
    const categoryName =
      payload.category_name || payload.type || "Processor (CPU)";
    const specs = Array.isArray(payload.specs)
      ? payload.specs
      : Array.isArray(payload.ingredients)
        ? payload.ingredients
        : [];
    const steps = Array.isArray(payload.steps) ? payload.steps : [];
    const productUrl = String(payload.product_url || "").trim();

    let created;

    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        `INSERT INTO products (
          sku, name, brand, category_id, category_name, price, stock, min_stock,
          rack_location, description, image_url, product_url, specs, steps,
          is_featured, is_weekly_pick, is_bestseller
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16,$17)
        RETURNING *`,
        [
          sku,
          payload.name,
          payload.brand || "OEM",
          payload.category_id || null,
          categoryName,
          Number(payload.price || 0),
          initialStock,
          Number(payload.min_stock ?? 5),
          payload.rack_location || "Rak A-01",
          payload.description || "",
          payload.image_url || "/hardware/cpu.svg",
          productUrl,
          JSON.stringify(specs),
          JSON.stringify(steps),
          Boolean(payload.is_featured),
          Boolean(payload.is_weekly_pick),
          Boolean(payload.is_bestseller),
        ]
      );
      created = rows[0];
    } else if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            sku,
            name: payload.name,
            brand: payload.brand || "OEM",
            category_name: categoryName,
            price: Number(payload.price || 0),
            stock: initialStock,
            min_stock: Number(payload.min_stock ?? 5),
            rack_location: payload.rack_location || "Rak A-01",
            description: payload.description || "",
            image_url: payload.image_url || "/hardware/cpu.svg",
            product_url: productUrl,
            specs,
            steps,
            is_featured: Boolean(payload.is_featured),
            is_weekly_pick: Boolean(payload.is_weekly_pick),
            is_bestseller: Boolean(payload.is_bestseller),
          },
        ])
        .select();
      if (error) throw error;
      created = data[0];
    } else {
      created = {
        id: memoryStore.genId(),
        sku,
        name: payload.name,
        brand: payload.brand || "OEM",
        category_id:
          payload.category_id || "11111111-1111-4111-8111-111111111101",
        category_name: categoryName,
        price: Number(payload.price || 0),
        stock: initialStock,
        min_stock: Number(payload.min_stock ?? 5),
        rack_location: payload.rack_location || "Rak A-01",
        description: payload.description || "",
        image_url: payload.image_url || "/hardware/cpu.svg",
        product_url: productUrl,
        specs,
        steps,
        is_featured: Boolean(payload.is_featured),
        is_weekly_pick: Boolean(payload.is_weekly_pick),
        is_bestseller: Boolean(payload.is_bestseller),
        created_at: new Date().toISOString(),
      };
      memoryStore.products.unshift(created);
      saveMemoryStore();
    }

    // Otomatis catat log stok awal agar penambahan komponen langsung muncul di Mutasi Stok (Stok Log)
    if (created && initialStock > 0) {
      await insertAutoStockLog({
        product_id: created.id,
        product_name: created.name,
        sku: created.sku,
        type: "IN",
        quantity: initialStock,
        previous_stock: 0,
        current_stock: initialStock,
        reference_no: `INIT-${Date.now().toString().slice(-5)}`,
        operator: payload.operator || "Admin Gudang",
        supplier_name: "Registrasi Komponen Baru",
        notes: `Stok awal saat registrasi komponen "${created.name}" (${created.rack_location || "Rak Gudang"})`,
      });
    }

    return created;
  },

  async update(id, payload, options = {}) {
    const existing = await this.getById(id);
    const prevStock = Number(existing.stock ?? 0);
    const nextStock =
      payload.stock !== undefined ? Number(payload.stock) : prevStock;

    let updated;

    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const merged = {
        sku: payload.sku ?? existing.sku,
        name: payload.name ?? existing.name,
        brand: payload.brand ?? existing.brand,
        category_name:
          payload.category_name ?? payload.type ?? existing.category_name,
        price: payload.price !== undefined ? Number(payload.price) : existing.price,
        stock: nextStock,
        min_stock:
          payload.min_stock !== undefined
            ? Number(payload.min_stock)
            : existing.min_stock,
        rack_location: payload.rack_location ?? existing.rack_location,
        description: payload.description ?? existing.description,
        image_url: payload.image_url ?? existing.image_url,
        product_url:
          payload.product_url !== undefined
            ? String(payload.product_url || "").trim()
            : existing.product_url || "",
        specs: payload.specs ?? payload.ingredients ?? existing.specs ?? [],
        steps: payload.steps ?? existing.steps ?? [],
        is_featured:
          payload.is_featured !== undefined
            ? Boolean(payload.is_featured)
            : existing.is_featured,
        is_weekly_pick:
          payload.is_weekly_pick !== undefined
            ? Boolean(payload.is_weekly_pick)
            : existing.is_weekly_pick,
        is_bestseller:
          payload.is_bestseller !== undefined
            ? Boolean(payload.is_bestseller)
            : existing.is_bestseller,
      };

      const { rows } = await pgPool.query(
        `UPDATE products SET
          sku=$1, name=$2, brand=$3, category_name=$4, price=$5, stock=$6,
          min_stock=$7, rack_location=$8, description=$9, image_url=$10,
          product_url=$11, specs=$12::jsonb, steps=$13::jsonb, is_featured=$14,
          is_weekly_pick=$15, is_bestseller=$16, updated_at=now()
         WHERE id=$17 RETURNING *`,
        [
          merged.sku,
          merged.name,
          merged.brand,
          merged.category_name,
          merged.price,
          merged.stock,
          merged.min_stock,
          merged.rack_location,
          merged.description,
          merged.image_url,
          merged.product_url,
          JSON.stringify(merged.specs),
          JSON.stringify(merged.steps),
          merged.is_featured,
          merged.is_weekly_pick,
          merged.is_bestseller,
          id,
        ]
      );
      updated = rows[0];
    } else if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("products")
        .update({
          ...(payload.sku !== undefined && { sku: payload.sku }),
          ...(payload.name !== undefined && { name: payload.name }),
          ...(payload.brand !== undefined && { brand: payload.brand }),
          ...(payload.category_name !== undefined && {
            category_name: payload.category_name,
          }),
          ...(payload.price !== undefined && { price: Number(payload.price) }),
          ...(payload.stock !== undefined && { stock: nextStock }),
          ...(payload.min_stock !== undefined && {
            min_stock: Number(payload.min_stock),
          }),
          ...(payload.rack_location !== undefined && {
            rack_location: payload.rack_location,
          }),
          ...(payload.description !== undefined && {
            description: payload.description,
          }),
          ...(payload.image_url !== undefined && {
            image_url: payload.image_url,
          }),
          ...(payload.product_url !== undefined && {
            product_url: String(payload.product_url || "").trim(),
          }),
          ...(payload.specs !== undefined && { specs: payload.specs }),
          ...(payload.steps !== undefined && { steps: payload.steps }),
          ...(payload.is_featured !== undefined && {
            is_featured: Boolean(payload.is_featured),
          }),
          ...(payload.is_weekly_pick !== undefined && {
            is_weekly_pick: Boolean(payload.is_weekly_pick),
          }),
          ...(payload.is_bestseller !== undefined && {
            is_bestseller: Boolean(payload.is_bestseller),
          }),
        })
        .eq("id", id)
        .select();
      if (error) throw error;
      updated = data[0];
    } else {
      const idx = memoryStore.products.findIndex(
        (p) => String(p.id) === String(id)
      );
      if (idx === -1) throw new Error("Product not found");
      memoryStore.products[idx] = {
        ...memoryStore.products[idx],
        ...payload,
        stock: nextStock,
        updated_at: new Date().toISOString(),
      };
      saveMemoryStore();
      updated = memoryStore.products[idx];
    }

    // Jika stok berubah lewat form Edit (bukan lewat StockLogModel), catat otomatis di stock_logs
    if (!options.skipStockLog && nextStock !== prevStock) {
      const diff = nextStock - prevStock;
      await insertAutoStockLog({
        product_id: updated.id,
        product_name: updated.name,
        sku: updated.sku,
        type: diff > 0 ? "IN" : "OUT",
        quantity: Math.abs(diff),
        previous_stock: prevStock,
        current_stock: nextStock,
        reference_no: `UPD-${Date.now().toString().slice(-5)}`,
        operator: payload.operator || "Admin Gudang",
        supplier_name: "Pembaruan Data Katalog",
        notes: `Penyesuaian stok melalui edit komponen (${prevStock} → ${nextStock})`,
      });
    }

    return updated;
  },

  async remove(id) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      await pgPool.query("DELETE FROM products WHERE id = $1", [id]);
      return { message: "Product deleted successfully" };
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return { message: "Product deleted successfully" };
    }

    memoryStore.products = memoryStore.products.filter(
      (p) => String(p.id) !== String(id)
    );
    saveMemoryStore();
    return { message: "Product deleted successfully" };
  },
};
