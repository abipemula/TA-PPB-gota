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
 * Otomatis mengurangi stok produk dan mencatat mutasi OUT ke tabel stock_logs di PostgreSQL.
 */
router.post("/", async (req, res) => {
  try {
    const {
      product_id,
      quantity = 1,
      payment_method = "GoPay",
      paid_amount,
      customer_name,
    } = req.body || {};

    if (!product_id) {
      return res.status(400).json({ error: "product_id wajib diisi." });
    }

    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ error: "Jumlah pembelian minimal 1 unit." });
    }

    const product = await ProductModel.getById(product_id);
    const currentStock = Number(product.stock ?? 0);
    if (currentStock < qty) {
      return res.status(400).json({
        error: `Stok tidak mencukupi. Tersisa ${currentStock} unit.`,
      });
    }

    const unitPrice = Number(product.price ?? 0);
    const totalPrice = unitPrice * qty;
    const paidAmount = Number(paid_amount ?? 0);

    if (!Number.isFinite(paidAmount) || paidAmount < totalPrice) {
      return res.status(400).json({
        error: `Nominal pembayaran (Rp ${paidAmount.toLocaleString("id-ID")}) kurang dari total tagihan (Rp ${totalPrice.toLocaleString("id-ID")}).`,
      });
    }

    const cleanMethod = ALLOWED_METHODS.includes(payment_method)
      ? payment_method
      : String(payment_method || "GoPay").slice(0, 40);
    const cleanCustomer =
      String(customer_name || "").trim().slice(0, 80) || "Customer RigLog";
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

    const log = await StockLogModel.create({
      product_id: product.id,
      type: "OUT",
      quantity: qty,
      reference_no: invoiceNo,
      operator: cleanCustomer,
      supplier_name: `Pembelian Customer (${cleanMethod})`,
      notes: `Checkout ${cleanMethod} — Nominal bayar Rp ${paidAmount.toLocaleString("id-ID")} (Total Rp ${totalPrice.toLocaleString("id-ID")})`,
    });

    return res.status(201).json({
      success: true,
      data: {
        invoice_no: invoiceNo,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
        paid_amount: paidAmount,
        change: Math.max(0, paidAmount - totalPrice),
        payment_method: cleanMethod,
        customer_name: cleanCustomer,
        remaining_stock: Number(log?.current_stock ?? Math.max(0, currentStock - qty)),
        stock_log_id: log?.id || null,
        created_at: log?.created_at || new Date().toISOString(),
      },
    });
  } catch (err) {
    const status = err.message === "Product not found" ? 404 : 400;
    return res.status(status).json({ error: err.message || "Gagal memproses checkout." });
  }
});

export default router;
