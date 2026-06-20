/*
 * Admin: download all submissions as a PDF.
 * Each participant becomes a "card" with their details + the actual
 * screenshot and frame images embedded (not links).
 *
 * Requires:  npm install pdfkit
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Op } from "sequelize";

import { Customer, Submission } from "../models/index.js";
import { requireAdmin } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function localImagePath(stored) {
  if (!stored) return null;
  const name = path.basename(stored);
  const p = path.join(UPLOADS_DIR, name);
  return fs.existsSync(p) ? p : null;
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// Always returns a readable status, even if the field is undefined/null.
function acceptedText(v) {
  return v ? "Accepted" : "Not accepted";
}

export function registerSubmissionsPdf(router) {
  router.get("/export/submissions/pdf", requireAdmin, async (req, res) => {
    try {
      const where = {};
      if (req.query.from || req.query.to) {
        where.createdAt = {};
        if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from + "T00:00:00");
        if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to + "T23:59:59");
      }

      const rows = await Submission.findAll({
        where,
        include: [{ model: Customer, as: "customer" }],
        order: [["createdAt", "DESC"]],
      });

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="submissions.pdf"');
      doc.pipe(res);

      doc.fontSize(20).fillColor("#1B2A4A").text("Galaxy Ultra Days — Submissions", { align: "left" });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#666")
        .text(`Generated: ${fmt(new Date())}   |   Total: ${rows.length}`);
      doc.moveDown(0.8);

      const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      rows.forEach((s, idx) => {
        const c = s.customer || {};

        // Taller card so all detail lines fit
        const cardHeight = 215;
        if (doc.y + cardHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }

        const top = doc.y;

        doc.roundedRect(doc.page.margins.left, top, pageW, cardHeight, 8)
          .strokeColor("#C9D4E5").lineWidth(1).stroke();

        const padX = doc.page.margins.left + 14;
        let y = top + 12;

        doc.fontSize(13).fillColor("#1B2A4A")
          .text(`${idx + 1}. ${c.name || "—"}`, padX, y, { continued: false });
        y += 20;

        const detailW = pageW - 230;
        doc.fontSize(9.5).fillColor("#333");
        const lines = [
          `Mobile: ${c.mobile || "—"}`,
          `IMEI: ${c.imei || "—"}`,
          `Email: ${c.email || "—"}`,
          `City: ${c.city || "—"}`,
          `Store: ${c.storeLocation || "—"}`,
          `SES ID / Manager: ${c.sesId || "—"}`,
          `Product: ${c.productPurchased || "—"}`,
          `Terms: ${acceptedText(c.termsAccepted)}`,
          `Privacy: ${acceptedText(c.privacyAccepted)}`,
          `OTP Verified: ${s.verified ? "Yes" : "No"}`,
          `Submitted: ${fmt(s.createdAt)}`,
        ];
        doc.text(lines.join("\n"), padX, y, { width: detailW, lineGap: 2 });

        const imgTop = top + 16;
        const imgW = 95, imgH = 130;
        const screenX = doc.page.margins.left + pageW - (imgW * 2) - 24;
        const frameX = doc.page.margins.left + pageW - imgW - 12;

        const shot = localImagePath(s.screenshotPath);
        const frame = localImagePath(s.framedImagePath);

        doc.fontSize(8).fillColor("#888");
        doc.text("Screenshot", screenX, imgTop - 11, { width: imgW, align: "center" });
        doc.text("Frame", frameX, imgTop - 11, { width: imgW, align: "center" });

        try {
          if (shot) doc.image(shot, screenX, imgTop, { fit: [imgW, imgH], align: "center" });
          else doc.rect(screenX, imgTop, imgW, imgH).strokeColor("#ddd").stroke()
            .fontSize(8).fillColor("#aaa").text("No image", screenX, imgTop + imgH / 2 - 4, { width: imgW, align: "center" });
        } catch { /* skip broken image */ }

        try {
          if (frame) doc.image(frame, frameX, imgTop, { fit: [imgW, imgH], align: "center" });
          else doc.rect(frameX, imgTop, imgW, imgH).strokeColor("#ddd").stroke()
            .fontSize(8).fillColor("#aaa").text("No image", frameX, imgTop + imgH / 2 - 4, { width: imgW, align: "center" });
        } catch { /* skip broken image */ }

        doc.y = top + cardHeight + 14;
      });

      if (rows.length === 0) {
        doc.fontSize(12).fillColor("#888").text("No submissions found for this range.");
      }

      doc.end();
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate PDF", error: err.message });
      } else {
        res.end();
      }
    }
  });
}