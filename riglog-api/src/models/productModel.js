import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";

export const ProductModel = {
  async getAll(filters = {}) {
    if (isSupabaseConfigured) {
      let query = supabase
        .from("products")
        .select(
          "id, sku, name, brand, description, price, stock, min_stock, rack_location, category_id, category_name, image_url, specs, is_featured, created_at, categories ( id, name )"
        );
      if (filters.category && filters.category !== "All") {
        query = query.eq("category_name", filters.category);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }

    let list = [...memoryStore.products];
    if (filters.category && filters.category !== "All") {
      list = list.filter(
        (p) =>
          (p.category_name || "").toLowerCase() === filters.category.toLowerCase()
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
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id, sku, name, brand, description, price, stock, min_stock, rack_location,
          category_id, category_name, image_url, specs, is_featured, created_at,
          categories ( id, name )
        `
        )
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
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("products")
        .insert([payload])
        .select();
      if (error) throw error;
      return data[0];
    }
    const newItem = {
      id: memoryStore.genId(),
      sku: payload.sku || `SKU-${Date.now().toString().slice(-5)}`,
      name: payload.name,
      brand: payload.brand || "OEM",
      category_id: payload.category_id || "11111111-1111-4111-8111-111111111101",
      category_name: payload.category_name || payload.type || "Processor (CPU)",
      price: Number(payload.price || 0),
      stock: Number(payload.stock ?? 0),
      min_stock: Number(payload.min_stock ?? 5),
      rack_location: payload.rack_location || "Rak A-01",
      description: payload.description || "",
      image_url: payload.image_url || "/hardware/cpu.svg",
      specs: Array.isArray(payload.specs) ? payload.specs : [],
      steps: Array.isArray(payload.steps) ? payload.steps : [],
      is_featured: Boolean(payload.is_featured),
      is_weekly_pick: Boolean(payload.is_weekly_pick),
      is_bestseller: Boolean(payload.is_bestseller),
      created_at: new Date().toISOString(),
    };
    memoryStore.products.unshift(newItem);
    saveMemoryStore();
    return newItem;
  },

  async update(id, payload) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    }
    const idx = memoryStore.products.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) throw new Error("Product not found");
    memoryStore.products[idx] = {
      ...memoryStore.products[idx],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    saveMemoryStore();
    return memoryStore.products[idx];
  },

  async remove(id) {
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
