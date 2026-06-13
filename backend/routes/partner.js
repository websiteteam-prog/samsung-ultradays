import express from "express";
import { Op } from "sequelize";

import { Customer, Submission } from "../models/index.js";
import { requirePartner } from "../middleware/requirePartner.js";

const router = express.Router();

function fileUrl(req, filename) {
  if (!filename) return null;

  const base =
    process.env.PUBLIC_BASE_URL ||
    `${req.protocol}://${req.get("host")}`;

  return `${base}/uploads/${filename}`;
}

router.get(
  "/submissions",
  requirePartner,
  async (req, res) => {
    try {
      const where = {};

      if (req.query.since) {
        where.createdAt = {
          [Op.gte]: new Date(req.query.since)
        };
      }

      if (req.query.from || req.query.to) {
        where.createdAt = {};

        if (req.query.from) {
          where.createdAt[Op.gte] =
            new Date(req.query.from + "T00:00:00");
        }

        if (req.query.to) {
          where.createdAt[Op.lte] =
            new Date(req.query.to + "T23:59:59");
        }
      }

      const rows = await Submission.findAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer"
          }
        ],
        order: [["createdAt", "DESC"]]
      });

      const records = rows.map((s) => {
        const c = s.customer || {};

        return {
          customerId: c.id,
          submissionId: s.id,

          name: c.name,
          mobile: c.mobile,
          imei: c.imei,
          email: c.email,

          city: c.city,
          storeLocation: c.storeLocation,
          productPurchased: c.productPurchased,

          giftEligible: c.giftEligible,
          giftClaimed: c.giftClaimed,

          submissionVerified: s.verified,

          screenshotUrl: fileUrl(
            req,
            s.screenshotPath
          ),

          framedImageUrl: fileUrl(
            req,
            s.framedImagePath
          ),

          registeredAt: c.createdAt,
          submittedAt: s.createdAt
        };
      });

      return res.json({
        success: true,
        total: records.length,
        records
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);

export default router;