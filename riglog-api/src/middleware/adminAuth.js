import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const getAdminPassword = () => process.env.ADMIN_PASSWORD || "riglog2026";
const getSigningSecret = () =>
  process.env.AUTH_SECRET || `riglog-secret-${getAdminPassword()}`;

export function createAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // Berlaku 7 hari
    })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }
  const [payload, sig] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");

  if (sig !== expectedSig) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return parsed.role === "admin" && Number(parsed.exp) > Date.now();
  } catch {
    return false;
  }
}

export function verifyPassword(password) {
  return String(password || "").trim() === String(getAdminPassword()).trim();
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : req.headers["x-admin-token"];

  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      error: "Akses ditolak. Silakan masuk sebagai Admin terlebih dahulu.",
    });
  }
  return next();
}
