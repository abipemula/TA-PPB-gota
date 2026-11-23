import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";

export const CategoryModel = {
  async create(payload) {
    const record = typeof payload === "string" ? { name: payload } : payload;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("categories")
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const newItem = {
      id: memoryStore.genId(),
      name: record.name,
      slug: record.slug || record.name.toLowerCase().replace(/\s+/g, "-"),
      aisle: record.aisle || "Lorong Gudang Umum",
      description: record.description || "",
      created_at: new Date().toISOString(),
    };
    memoryStore.categories.push(newItem);
    saveMemoryStore();
    return newItem;
  },

  async getAll() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    }
    return memoryStore.categories;
  },

  async getById(id) {
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
