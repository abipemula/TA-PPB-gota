import { isPostgresConfigured, pgPool, ensurePostgresReady } from "../config/db.js";
import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";

export const CategoryModel = {
  async create(payload) {
    const record = typeof payload === "string" ? { name: payload } : payload;
    const slug = record.slug || record.name.toLowerCase().replace(/\s+/g, "-");
    const aisle = record.aisle || "Lorong Gudang Umum";
    const description = record.description || "";

    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        `INSERT INTO categories (name, slug, aisle, description)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [record.name, slug, aisle, description]
      );
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: record.name, slug, aisle, description }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const newItem = {
      id: memoryStore.genId(),
      name: record.name,
      slug,
      aisle,
      description,
      created_at: new Date().toISOString(),
    };
    memoryStore.categories.push(newItem);
    saveMemoryStore();
    return newItem;
  },

  async getAll() {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        "SELECT * FROM categories ORDER BY name ASC"
      );
      return rows;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    }
    return memoryStore.categories;
  },

  async getById(id) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        "SELECT * FROM categories WHERE id = $1 LIMIT 1",
        [id]
      );
      if (!rows[0]) throw new Error("Category not found");
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    }
    const found = memoryStore.categories.find((c) => c.id === id);
    if (!found) throw new Error("Category not found");
    return found;
  },

  async update(id, payload) {
    const updates = typeof payload === "string" ? { name: payload } : payload;

    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const existing = await this.getById(id);
      const { rows } = await pgPool.query(
        `UPDATE categories SET name=$1, aisle=$2, description=$3 WHERE id=$4 RETURNING *`,
        [
          updates.name ?? existing.name,
          updates.aisle ?? existing.aisle,
          updates.description ?? existing.description,
          id,
        ]
      );
      return rows[0];
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    memoryStore.categories[idx] = { ...memoryStore.categories[idx], ...updates };
    saveMemoryStore();
    return memoryStore.categories[idx];
  },

  async remove(id) {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      await pgPool.query("DELETE FROM categories WHERE id = $1", [id]);
      return { message: "Category deleted" };
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      return { message: "Category deleted" };
    }
    memoryStore.categories = memoryStore.categories.filter((c) => c.id !== id);
    saveMemoryStore();
    return { message: "Category deleted" };
  },
};
