import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api.js";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", mobile: "", imei: "", email: "",
    city: "", storeLocation: "", sesId: "", productPurchased: "",
  });

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [devCode, setDevCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function sendOtp() {
    setErr("");
    if (!/^\d{10}$/.test(form.mobile)) return setErr("Enter a valid 10-digit mobile number.");
    setBusy(true);
    try {
      const r = await api.requestOtp(form.mobile);
      setOtpSent(true);
      if (r.devCode) setDevCode(r.devCode);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setErr("");
    if (!otp) return setErr("Enter the OTP sent to your mobile.");
    setBusy(true);
    try {
      await api.verifyOtp({ mobile: form.mobile, code: otp });
      setOtpVerified(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function validate() {
    if (!form.name.trim()) return "Full name is required.";
    if (!/^\d{10}$/.test(form.mobile)) return "Mobile number must be 10 digits.";
    if (!otpVerified) return "Please verify your mobile number with OTP.";
    if (!/^\d{15}$/.test(form.imei)) return "IMEI number must be exactly 15 digits.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (!form.city.trim()) return "City is required.";
    if (!form.storeLocation.trim()) return "Store is required.";
    if (!form.sesId.trim()) return "SES ID / Store Manager is required.";
    if (!form.productPurchased.trim()) return "Product purchased is required.";
    return "";
  }

  async function submit() {
    const v = validate();
    if (v) { setErr(v); return; }
    setErr("");
    setBusy(true);
    try {
      await api.register({ ...form, otp });
      sessionStorage.setItem("customerName", form.name.trim());
      sessionStorage.setItem("customerMobile", form.mobile.trim());
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="wrap">
        <Link className="back" to="/">← Home</Link>
        <div className="card">
          <span className="eyebrow">Step 1 complete</span>
          <h2>You're registered 🎉</h2>
          <p className="lead">
            You're eligible for the complimentary travel adaptor. Show this screen
            to the store staff to collect your gift.
          </p>
          <button className="btn gold" onClick={() => nav("/frame")}>
            Next: create your frame →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <Link className="back" to="/">← Home</Link>
      <span className="eyebrow">Step 1 of 3</span>
      <h1>Register your purchase</h1>
      <p className="lead">Verify your mobile and enter your details. All fields are required.</p>

      <div className="card">
        <label className="field">Full name *
          <input value={form.name} onChange={set("name")} placeholder="Your name" />
        </label>

        <label className="field">Mobile number *
          <input value={form.mobile} onChange={set("mobile")} placeholder="10-digit mobile"
            inputMode="numeric" maxLength={10} disabled={otpVerified} />
        </label>

        {/* OTP verification block */}
        {!otpVerified && (
          <>
            <button className="btn ghost" onClick={sendOtp} disabled={busy} style={{ marginTop: 14 }}>
              {otpSent ? "Resend OTP" : "Send OTP"}
            </button>
            {devCode && <div className="note">Dev OTP: <strong>{devCode}</strong></div>}
            {otpSent && (
              <>
                <label className="field">Enter OTP *
                  <input value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code" inputMode="numeric" maxLength={6} />
                </label>
                <button className="btn" onClick={verifyOtp} disabled={busy} style={{ marginTop: 12 }}>
                  Verify OTP
                </button>
              </>
            )}
          </>
        )}
        {otpVerified && <div className="alert ok">Mobile number verified ✓</div>}

        <label className="field">IMEI number *
          <input value={form.imei} onChange={set("imei")} placeholder="15-digit IMEI"
            inputMode="numeric" maxLength={15} />
        </label>
        <label className="field">Email *
          <input value={form.email} onChange={set("email")} placeholder="you@example.com" />
        </label>

        <label className="field">City *
          <input value={form.city} onChange={set("city")} placeholder="Your city" />
        </label>

        <label className="field">Store *
          <input value={form.storeLocation} onChange={set("storeLocation")} placeholder="Store name" />
        </label>

        <label className="field">SES ID / Store Manager *
          <input value={form.sesId} onChange={set("sesId")} placeholder="SES ID or Store Manager name" />
        </label>

        <label className="field">Product purchased *
          <input value={form.productPurchased} onChange={set("productPurchased")} placeholder="e.g. Galaxy S24" />
        </label>

        {err && <div className="alert err">{err}</div>}

        <button className="btn gold" onClick={submit} disabled={busy || !otpVerified}>
          {busy ? "Submitting…" : "Register & unlock gift"}
        </button>
      </div>
    </div>
  );
}