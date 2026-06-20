import express from "express";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { Admin, Customer, Submission } from "../models/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { registerSubmissionsPdf } from "./pdf_route.js";

const router = express.Router();

function fileUrl(req, filename) {
  if (!filename) return null;
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

function toCsv(rows, columns) {
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(",")).join("\n");
  return header + "\n" + body;
}

// Build a date-range WHERE clause from optional ?from=YYYY-MM-DD&to=YYYY-MM-DD
function dateWhere(query) {
  const where = {};
  const { from, to } = query;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from + "T00:00:00");
    if (to) where.createdAt[Op.lte] = new Date(to + "T23:59:59");
  }
  return where;
}

// Turn a boolean into a readable status for admin/CSV/PDF
function acceptedText(v) {
  return v ? "Accepted" : "Not accepted";
}

/* ---------------- Login ---------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const admin = await Admin.findOne({ where: { email: email.toLowerCase() } });
  if (!admin || !(await admin.verifyPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, email: admin.email });
});

/* ---------------- Dashboard summary ---------------- */
router.get("/summary", requireAdmin, async (req, res) => {
  const [registrations, submissions] = await Promise.all([
    Customer.count(),
    Submission.count(),
  ]);
  res.json({ registrations, submissions, completed: submissions, pending: registrations - submissions });
});

/*
 * Combined view: every submission joined with its registration.
 * This is the single source the admin panel uses — full user journey
 * (registration fields + proof) in one row. Optional date filter.
 */
async function getCombined(req) {
  const where = dateWhere(req.query);
  const rows = await Submission.findAll({
    where,
    include: [{ model: Customer, as: "customer" }],
    order: [["createdAt", "DESC"]],
  });
  return rows.map((s) => {
    const c = s.customer || {};
    return {
      id: s.id,
      name: c.name || "",
      mobile: s.mobile,
      imei: c.imei || "",
      email: c.email || "",
      city: c.city || "",
      storeLocation: c.storeLocation || "",
      sesId: c.sesId || "",
      productPurchased: c.productPurchased || "",
      termsAccepted: acceptedText(c.termsAccepted),
      privacyAccepted: acceptedText(c.privacyAccepted),
      verified: s.verified,
      registeredAt: c.createdAt || null,
      submittedAt: s.createdAt,
      screenshotUrl: fileUrl(req, s.screenshotPath),
      framedImageUrl: fileUrl(req, s.framedImagePath),
    };
  });
}

/* ---------------- Combined submissions (with date filter) ---------------- */
router.get("/submissions", requireAdmin, async (req, res) => {
  const data = await getCombined(req);
  res.json(data);
});

/* ---------------- Combined CSV export (with date filter) ---------------- */
router.get("/export/submissions", requireAdmin, async (req, res) => {
  const data = await getCombined(req);
  const csv = toCsv(data, [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "mobile", label: "Mobile" },
    { key: "imei", label: "IMEI" },
    { key: "email", label: "Email" },
    { key: "city", label: "City" },
    { key: "storeLocation", label: "Store" },
    { key: "sesId", label: "SES ID / Store Manager" },
    { key: "productPurchased", label: "Product" },
    { key: "termsAccepted", label: "Terms" },
    { key: "privacyAccepted", label: "Privacy" },
    { key: "verified", label: "Verified" },
    { key: "registeredAt", label: "Registered At" },
    { key: "submittedAt", label: "Submitted At" },
    { key: "screenshotUrl", label: "Screenshot URL" },
    { key: "framedImageUrl", label: "Frame URL" },
  ]);
  res.header("Content-Type", "text/csv");
  res.attachment("submissions.csv");
  res.send(csv);
});


registerSubmissionsPdf(router);

export default router;