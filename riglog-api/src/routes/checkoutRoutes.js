import express from "express";
import { ProductModel } from "../models/productModel.js";
import { StockLogModel } from "../models/stockLogModel.js";

const router = express.Router();

const ALLOWED_METHODS = [
  "BCA",
  "BRI",
  "Mandiri",
  "BNI",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "QRIS",
];

/**
 * POST /api/checkout
 * Endpoint publik (Customer) untuk simulasi pembelian & pembayaran lokal (Bank / E-Wallet).
 * Mendukung:
 * - Single item: { product_id, quantity, payment_method, paid_amount, customer_name }
 * - Multi item (Keranjang): { items: [{ product_id, quantity }], payment_method, paid_amount, customer_name }
 * Otomatis mengurangi stok setiap produk & mencatat mutasi OUT ke tabel stock_logs di PostgreSQL.
 */
router.post("/", async (req, res) => {
  try {
    const {
      items,
      product_id,
      quantity = 1,
      payment_method = "GoPay",
      paid_amount,
      customer_name,
    } = req.body || {};

    // Normalisasi ke array items agar single & batch checkout memakai alur validasi yang sama
    let requestedItems = [];
    if (Array.isArray(items) && items.length > 0) {
      requestedItems = items.map((entry) => ({
        product_id: entry?.product_id,
        quantity: Math.floor(Number(entry?.quantity ?? 1)),
      }));
    } else if (product_id) {
      requestedItems = [
        {
          product_id,
          quantity: Math.floor(Number(quantity ?? 1)),
        },
      ];
    } else {
      return res.status(400).json({
        error: "Pilih minimal 1 komponen (product_id atau items) untuk checkout.",
      });
    }

    // Gabungkan jika ada product_id duplikat di dalam array items
    const mergedMap = new Map();
    for (const entry of requestedItems) {
      if (!entry.product_id) {
        return res.status(400).json({ error: "Setiap item harus memiliki product_id." });
      }
      if (!Number.isFinite(entry.quantity) || entry.quantity < 1) {
        return res.status(400).json({ error: "Jumlah pembelian minimal 1 unit per komponen." });
      }
      const key = String(entry.product_id);
      mergedMap.set(key, (mergedMap.get(key) || 0) + entry.quantity);
    }

    // Ambil semua produk dari DB dan validasi ketersediaan stok SEBELUM melakukan mutasi
    const validatedEntries = [];
    let grandTotal = 0;

    for (const [pid, qty] of mergedMap.entries()) {
      const product = await ProductModel.getById(pid);
      const currentStock = Number(product.stock ?? 0);
      if (currentStock < qty) {
        return res.status(400).json({
          error: `Stok "${product.name}" tidak mencukupi (tersisa ${currentStock} unit, diminta ${qty} unit).`,
        });
      }
      const unitPrice = Number(product.price ?? 0);
      const subtotal = unitPrice * qty;
      grandTotal += subtotal;
      validatedEntries.push({
        product,
        quantity: qty,
        unitPrice,
        subtotal,
        currentStock,
      });
    }

    const paidAmount = Number(paid_amount ?? 0);
    if (!Number.isFinite(paidAmount) || paidAmount < grandTotal) {
      return res.status(400).json({
        error: `Nominal pembayaran (Rp ${paidAmount.toLocaleString("id-ID")}) kurang dari total tagihan (Rp ${grandTotal.toLocaleString("id-ID")}).`,
      });
    }

    const cleanMethod = ALLOWED_METHODS.includes(payment_method)
      ? payment_method
      : String(payment_method || "GoPay").slice(0, 40);
    const cleanCustomer =
      String(customer_name || "").trim().slice(0, 80) || "Customer RigLog";
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const isCartBatch = validatedEntries.length > 1;

    // Eksekusi pengurangan stok + catat log mutasi OUT untuk setiap item
    const processedItems = [];
    let latestCreatedAt = new Date().toISOString();

    for (const entry of validatedEntries) {
      const log = await StockLogModel.create({
        product_id: entry.product.id,
        type: "OUT",
        quantity: entry.quantity,
        reference_no: invoiceNo,
        operator: cleanCustomer,
        supplier_name: `Pembelian Customer (${cleanMethod})`,
        notes: isCartBatch
          ? `Checkout Keranjang (${validatedEntries.length} item) via ${cleanMethod} — Subtotal Rp ${entry.subtotal.toLocaleString("id-ID")} (Total Invoice Rp ${grandTotal.toLocaleString("id-ID")})`
          : `Checkout ${cleanMethod} — Nominal bayar Rp ${paidAmount.toLocaleString("id-ID")} (Total Rp ${grandTotal.toLocaleString("id-ID")})`,
      });

      if (log?.created_at) latestCreatedAt = log.created_at;

      processedItems.push({
        product_id: entry.product.id,
        product_name: entry.product.name,
        sku: entry.product.sku,
        quantity: entry.quantity,
        unit_price: entry.unitPrice,
        subtotal: entry.subtotal,
        remaining_stock: Number(
          log?.current_stock ?? Math.max(0, entry.currentStock - entry.quantity)
        ),
        stock_log_id: log?.id || null,
      });
    }

    const first = processedItems[0];
    const totalQuantity = processedItems.reduce((sum, i) => sum + i.quantity, 0);

    return res.status(201).json({
      success: true,
      data: {
        invoice_no: invoiceNo,
        customer_name: cleanCustomer,
        payment_method: cleanMethod,
        items: processedItems,
        total_items: processedItems.length,
        total_quantity: totalQuantity,
        total_price: grandTotal,
        paid_amount: paidAmount,
        change: Math.max(0, paidAmount - grandTotal),
        created_at: latestCreatedAt,
        // Field kompatibilitas untuk single-item checkout (HardwareDetail)
        product_id: first.product_id,
        product_name: first.product_name,
        sku: first.sku,
        quantity: first.quantity,
        unit_price: first.unit_price,
        remaining_stock: first.remaining_stock,
        stock_log_id: first.stock_log_id,
      },
    });
  } catch (err) {
    const status = err.message === "Product not found" ? 404 : 400;
    return res
      .status(status)
      .json({ error: err.message || "Gagal memproses checkout." });
  }
});

export default router;
