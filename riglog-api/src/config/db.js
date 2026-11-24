import dotenv from "dotenv";
import pg from "pg";
import { DEFAULT_DATA } from "./memoryStore.js";

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const isPostgresConfigured = Boolean(
  databaseUrl &&
    (databaseUrl.startsWith("postgres://") ||
      databaseUrl.startsWith("postgresql://"))
);

export const pgPool = isPostgresConfigured
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    })
  : null;

let initialized = false;

/**
 * Inisialisasi otomatis tabel PostgreSQL (Neon / Supabase Postgres)
 * dan isi seed awal jika tabel masih kosong.
 */
export async function ensurePostgresReady() {
  if (!isPostgresConfigured || !pgPool || initialized) return;

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text,
      aisle text,
      description text,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text,
      phone text,
      address text,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sku text UNIQUE NOT NULL,
      name text NOT NULL,
      brand text DEFAULT 'Generic',
      category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
      category_name text DEFAULT 'Processor (CPU)',
      price numeric(12,2) DEFAULT 0,
      stock integer DEFAULT 0,
      min_stock integer DEFAULT 5,
      rack_location text DEFAULT 'Rak A-01',
      description text,
      image_url text,
      specs jsonb DEFAULT '[]'::jsonb,
      steps jsonb DEFAULT '[]'::jsonb,
      is_featured boolean DEFAULT false,
      is_weekly_pick boolean DEFAULT false,
      is_bestseller boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid REFERENCES products(id) ON DELETE SET NULL,
      product_name text,
      sku text,
      type text NOT NULL CHECK (type IN ('IN', 'OUT', 'AUDIT')),
      quantity integer NOT NULL,
      previous_stock integer DEFAULT 0,
      current_stock integer DEFAULT 0,
      reference_no text,
      operator text DEFAULT 'Admin Gudang',
      supplier_name text,
      notes text,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz DEFAULT now()
    );
  `);

  // Seed data awal hanya jika tabel categories & products masih kosong
  const { rows: catCount } = await pgPool.query(
    "SELECT COUNT(*)::int AS cnt FROM categories"
  );
  if (catCount[0].cnt === 0) {
    for (const c of DEFAULT_DATA.categories) {
      await pgPool.query(
        `INSERT INTO categories (id, name, slug, aisle, description)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.slug, c.aisle, c.description]
      );
    }
  }

  const { rows: supCount } = await pgPool.query(
    "SELECT COUNT(*)::int AS cnt FROM suppliers"
  );
  if (supCount[0].cnt === 0) {
    for (const s of DEFAULT_DATA.suppliers) {
      await pgPool.query(
        `INSERT INTO suppliers (id, name, email, phone, address)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.email, s.phone, s.address]
      );
    }
  }

  const { rows: prodCount } = await pgPool.query(
    "SELECT COUNT(*)::int AS cnt FROM products"
  );
  if (prodCount[0].cnt === 0) {
    for (const p of DEFAULT_DATA.products) {
      await pgPool.query(
        `INSERT INTO products (
          id, sku, name, brand, category_id, category_name, price, stock, min_stock,
          rack_location, description, image_url, specs, steps,
          is_featured, is_weekly_pick, is_bestseller
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16,$17)
        ON CONFLICT (sku) DO NOTHING`,
        [
          p.id,
          p.sku,
          p.name,
          p.brand,
          p.category_id,
          p.category_name,
          p.price,
          p.stock,
          p.min_stock,
          p.rack_location,
          p.description,
          p.image_url,
          JSON.stringify(p.specs || []),
          JSON.stringify(p.steps || []),
          Boolean(p.is_featured),
          Boolean(p.is_weekly_pick),
          Boolean(p.is_bestseller),
        ]
      );
    }
  }

  const { rows: logCount } = await pgPool.query(
    "SELECT COUNT(*)::int AS cnt FROM stock_logs"
  );
  if (logCount[0].cnt === 0) {
    for (const l of DEFAULT_DATA.stock_logs) {
      await pgPool.query(
        `INSERT INTO stock_logs (
          id, product_id, product_name, sku, type, quantity, previous_stock,
          current_stock, reference_no, operator, supplier_name, notes, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO NOTHING`,
        [
          l.id,
          l.product_id,
          l.product_name,
          l.sku,
          l.type,
          l.quantity,
          l.previous_stock,
          l.current_stock,
          l.reference_no,
          l.operator,
          l.supplier_name,
          l.notes,
          l.created_at,
        ]
      );
    }
  }

  initialized = true;
}
