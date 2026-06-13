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

  // ---- Real SMS gateway integration goes here ----
  // await fetch("https://your-sms-gateway/send", {
  //   method: "POST",
  //   body: JSON.stringify({ to: mobile, text: `Your OTP is ${code}` }),
  // });
  // -------------------------------------------------
  return { sent: true };
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