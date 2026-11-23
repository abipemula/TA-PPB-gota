import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore } from "../config/memoryStore.js";
import { ProductModel } from "./productModel.js";

export const StockLogModel = {
  async getAll() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("stock_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...memoryStore.stock_logs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  },

  async getById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("stock_logs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    }
    const found = memoryStore.stock_logs.find((l) => String(l.id) === String(id));
    if (!found) throw new Error("Stock log not found");
    return found;
  },

  async create(payload) {
    const product = await ProductModel.getById(payload.product_id);
    const prevStock = Number(product.stock || 0);
    const qty = Number(payload.quantity || 0);
    const type = (payload.type || "IN").toUpperCase();

    let nextStock = prevStock;
    if (type === "IN") {
      nextStock = prevStock + qty;
    } else if (type === "OUT") {
      nextStock = Math.max(0, prevStock - qty);
    } else if (type === "AUDIT") {
      nextStock = qty;
    }

    await ProductModel.update(product.id, { stock: nextStock });

    const logRecord = {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      type,
      quantity: qty,
      previous_stock: prevStock,
      current_stock: nextStock,
      reference_no: payload.reference_no || `LOG-${Date.now().toString().slice(-6)}`,
      operator: payload.operator || "Admin Gudang",
      supplier_name: payload.supplier_name || "Internal Gudang",
      notes: payload.notes || "",
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("stock_logs")
        .insert([logRecord])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const created = {
      id: memoryStore.genId(),
      ...logRecord,
      created_at: new Date().toISOString(),
    };
    memoryStore.stock_logs.unshift(created);
    saveMemoryStore();
    return created;
  },

  async remove(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("stock_logs").delete().eq("id", id);
      if (error) throw error;
      return { message: "Stock log deleted successfully" };
    }
    memoryStore.stock_logs = memoryStore.stock_logs.filter(
      (l) => String(l.id) !== String(id)
    );
    saveMemoryStore();
    return { message: "Stock log deleted successfully" };
  },
};
