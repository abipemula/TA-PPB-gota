import { isPostgresConfigured, pgPool, ensurePostgresReady } from "../config/db.js";
import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";

export const SupplierModel = {
  async getAll() {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        "SELECT * FROM suppliers ORDER BY created_at DESC"
      );
      return rows;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("suppliers").select("*");
      if (error) throw error;
      return data;
    }
    return memoryStore.suppliers;
  },

  async getById(id) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        "SELECT * FROM suppliers WHERE id = $1 LIMIT 1",
        [id]
      );
      if (!rows[0]) throw new Error("Supplier not found");
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    }
    const found = memoryStore.suppliers.find((s) => s.id === id);
    if (!found) throw new Error("Supplier not found");
    return found;
  },

  async create(supplier) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        `INSERT INTO suppliers (name, email, phone, address)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [
          supplier.name,
          supplier.email || "",
          supplier.phone || "",
          supplier.address || "",
        ]
      );
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("suppliers")
        .insert([supplier])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const newItem = {
      id: memoryStore.genId(),
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      created_at: new Date().toISOString(),
    };
    memoryStore.suppliers.push(newItem);
    saveMemoryStore();
    return newItem;
  },

  async update(id, supplier) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const existing = await this.getById(id);
      const { rows } = await pgPool.query(
        `UPDATE suppliers SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *`,
        [
          supplier.name ?? existing.name,
          supplier.email ?? existing.email,
          supplier.phone ?? existing.phone,
          supplier.address ?? existing.address,
          id,
        ]
      );
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("suppliers")
        .update(supplier)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Supplier not found");
    memoryStore.suppliers[idx] = { ...memoryStore.suppliers[idx], ...supplier };
    saveMemoryStore();
    return memoryStore.suppliers[idx];
  },

  async remove(id) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      await pgPool.query("DELETE FROM suppliers WHERE id = $1", [id]);
      return { message: "Supplier deleted successfully" };
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
      return { message: "Supplier deleted successfully" };
    }
    memoryStore.suppliers = memoryStore.suppliers.filter((s) => s.id !== id);
    saveMemoryStore();
    return { message: "Supplier deleted successfully" };
  },
};
