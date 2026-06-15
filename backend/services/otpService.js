import { Op } from "sequelize";
import { Otp } from "../models/index.js";

const OTP_TTL_MINUTES = 5;
// After an OTP is verified, the mobile stays "verified" for this long so the
// user can finish filling the form and submit registration.
const VERIFIED_WINDOW_MINUTES = 30;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

export async function sendOtp(mobile) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Remove any previous OTPs for this number
  await Otp.destroy({ where: { mobile } });
  await Otp.create({ mobile, code, expiresAt, used: false });

  const mode = process.env.OTP_MODE || "mock";
  if (mode === "mock") {
    console.log(`[OTP][mock] mobile=${mobile} code=${code}`);
    return { sent: true, devCode: code }; // remove devCode for production
  }

  // ---- Real SMS via uEngage (template-based transactional SMS) ----
  await sendSmsViaUengage(mobile, code);
  return { sent: true };
}

// Sends the OTP through uEngage's sendTemplate API.
// Template 31988 ("User-OTP-Authentication") has a single variable -> the OTP.
async function sendSmsViaUengage(mobile, code) {
  const apiToken = process.env.UENGAGE_API_TOKEN;   // secure token from uEngage Profile
  const senderId = process.env.UENGAGE_SENDER_ID || "HSTGMD";
  const templateId = process.env.UENGAGE_TEMPLATE_ID || "31988";

  // Build the request URL exactly as per uEngage documentation.
  // Using apiToken instead of usr+pwd (more secure).
  const params = new URLSearchParams({
    apiToken,
    mobileNo: mobile,        // 10-digit number
    senderId,
    templateId,
    param: code,             // single template variable = the OTP
    longSms: "1",
  });

  const url = `https://www.uengage.in/ueapi/sendTemplate?${params.toString()}`;

  try {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    console.log(`[OTP][uengage] mobile=${mobile} status=${res.status} response=${text}`);
    if (!res.ok) {
      throw new Error(`uEngage responded ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error("[OTP][uengage] send failed:", err.message);
    throw new Error("Failed to send OTP SMS. Please try again.");
  }
}

// Verify the code. On success, mark the OTP as used (verified) but KEEP the row
// so registration can confirm this mobile was verified recently.
export async function verifyOtp(mobile, code) {
  const record = await Otp.findOne({
    where: {
      mobile,
      code,
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  if (!record) return false;
  record.used = true;           // "used" here means "verified"
  await record.save();
  return true;
}

// Check whether this mobile was verified within the allowed window.
// Used at registration so we don't re-consume the OTP.
export async function isMobileVerified(mobile) {
  const since = new Date(Date.now() - VERIFIED_WINDOW_MINUTES * 60 * 1000);
  const record = await Otp.findOne({
    where: {
      mobile,
      used: true,
      updatedAt: { [Op.gt]: since },
    },
  });
  return !!record;
}