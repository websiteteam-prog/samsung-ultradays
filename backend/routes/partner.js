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
      // ---- Filters on the Submission (date range) ----
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

      // ---- Filters on the Customer (mobile / imei) ----
      // mobile and imei live on the Customer, so they are applied
      // to the included customer association below.
      const customerWhere = {};

      if (req.query.mobile) {
        customerWhere.mobile = req.query.mobile.trim();
      }

      if (req.query.imei) {
        customerWhere.imei = req.query.imei.trim();
      }

      const hasCustomerFilter = Object.keys(customerWhere).length > 0;

      // ---- Pagination ----
      // ?page=1&limit=50  (page is 1-based; limit capped at 500)
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || 50, 1),
        500
      );
      const offset = (page - 1) * limit;

      const { count, rows } = await Submission.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer",
            where: hasCustomerFilter ? customerWhere : undefined,
            // required:true makes the mobile/imei filter actually
            // restrict the results (INNER JOIN) when a filter is set.
            required: hasCustomerFilter
          }
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
        distinct: true // correct total count when using include
      });

            const totalPages =
        Math.ceil(count / limit) || 1;

      // Explicit response when no data found
      if (count === 0) {
        return res.status(200).json({
          success: true,
          message: "No records found",
          total: 0,
          count: 0,
          page,
          limit,
          totalPages,
          hasNextPage: false,
          records: []
        });
      }

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
          sesId: c.sesId,
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
        message: "Records fetched successfully",
        total: count,        
        count: records.length, 
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
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