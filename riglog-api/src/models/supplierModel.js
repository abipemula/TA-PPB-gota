import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";

export const SupplierModel = {
  async getAll() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("suppliers").select("*");
      if (error) throw error;
      return data;
    }
    return memoryStore.suppliers;
  },

  async getById(id) {
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
