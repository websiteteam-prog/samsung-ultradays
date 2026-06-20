import express from "express";
import { upload } from "../config/upload.js";
import { Customer, Submission } from "../models/index.js";
import { sendOtp, verifyOtp, isMobileVerified } from "../services/otpService.js";

const router = express.Router();

function fileUrl(req, filename) {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

/* ----------------------------------------------------------------
 * OTP — request and verify (used during registration, Step 1)
 * No "must be registered" check here, because OTP happens BEFORE
 * the customer record is created.
 * ---------------------------------------------------------------- */
router.post("/otp/request", async (req, res) => {
  const { mobile } = req.body;
  if (!/^\d{10}$/.test(mobile || "")) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
  }
  const result = await sendOtp(mobile);
  res.json({ message: "OTP sent", ...result });
});

router.post("/otp/verify", async (req, res) => {
  const { mobile, code } = req.body;
  if (!mobile || !code) return res.status(400).json({ message: "Mobile and code are required" });
  const ok = await verifyOtp(mobile, code);
  if (!ok) return res.status(400).json({ message: "Invalid or expired OTP" });
  res.json({ message: "OTP verified", verified: true });
});

/* ----------------------------------------------------------------
 * STEP 1 — Product purchase & registration
 * Mobile must be OTP-verified first (otp + mobile sent together).
 * All fields mandatory. IMEI exactly 15 digits.
 * Terms & Privacy must be accepted.
 * Mobile AND IMEI must each be unique (one registration each).
 * ---------------------------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const {
      name, mobile, otp, imei, email, city, storeLocation, sesId, productPurchased,
      termsAccepted, privacyAccepted,
    } = req.body;

    if (!name || !mobile || !imei || !email || !city || !storeLocation || !sesId || !productPurchased) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: "Mobile number must be 10 digits." });
    }
    if (!/^\d{15}$/.test(imei)) {
      return res.status(400).json({ message: "IMEI number must be exactly 15 digits." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (!termsAccepted) {
      return res.status(400).json({ message: "Please accept the Terms & Conditions." });
    }
    if (!privacyAccepted) {
      return res.status(400).json({ message: "Please accept the Privacy Policy." });
    }

    // Mobile must have been OTP-verified (during the OTP step on this page)
    const verified = await isMobileVerified(mobile);
    if (!verified) {
      return res.status(400).json({ message: "Please verify your mobile number with OTP first." });
    }

    // Mobile number must be unique — one registration per number
    const existingMobile = await Customer.findOne({ where: { mobile } });
    if (existingMobile) {
      return res.status(409).json({ message: "This mobile number is already registered." });
    }

    // IMEI must be unique — one registration per device
    const existingImei = await Customer.findOne({ where: { imei } });
    if (existingImei) {
      return res.status(409).json({ message: "This IMEI number is already registered." });
    }

    const customer = await Customer.create({
      name, mobile, imei, email, city, storeLocation, sesId, productPurchased,
      termsAccepted: !!termsAccepted,
      privacyAccepted: !!privacyAccepted,
    });

    res.status(201).json({
      message: "Registration successful. You are eligible for the complimentary travel adaptor.",
      customerId: customer.id,
      giftEligible: customer.giftEligible,
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

/* ----------------------------------------------------------------
 * STEP 2 — Optional raw image upload (frame composed on frontend)
 * ---------------------------------------------------------------- */
router.post("/frame/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  res.json({ message: "Image uploaded", path: req.file.filename, url: fileUrl(req, req.file.filename) });
});

/* ----------------------------------------------------------------
 * STEP 3 — Social media proof upload
 * Only mobile + screenshot. Mobile links to the registration.
 * No OTP here (OTP already done at registration).
 * ---------------------------------------------------------------- */
router.post(
  "/submit",
  upload.fields([
    { name: "screenshot", maxCount: 1 },
    { name: "framedImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { mobile } = req.body;
      if (!/^\d{10}$/.test(mobile || "")) {
        return res.status(400).json({ message: "Enter your registered 10-digit mobile number." });
      }

      const screenshot = req.files?.screenshot?.[0];
      if (!screenshot) return res.status(400).json({ message: "Screenshot is required." });

      const customer = await Customer.findOne({
        where: { mobile },
        order: [["createdAt", "DESC"]],
      });
      if (!customer) {
        return res.status(404).json({ message: "This mobile number is not registered. Please complete Step 1 first." });
      }

      const framed = req.files?.framedImage?.[0];
      const submission = await Submission.create({
        customerId: customer.id,
        mobile,
        screenshotPath: screenshot.filename,
        framedImagePath: framed ? framed.filename : null,
        verified: true,
      });

      res.status(201).json({
        message: "Submission received. Thank you for participating!",
        submissionId: submission.id,
      });
    } catch (err) {
      res.status(500).json({ message: "Submission failed", error: err.message });
    }
  }
);

export default router;