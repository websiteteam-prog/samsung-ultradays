import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api.js";

export default function ProofSubmission() {
  const [screenshot, setScreenshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // Already-complete popup
  const [alreadyDone, setAlreadyDone] = useState(false);

  // Mobile may come from the registration step (sessionStorage),
  // otherwise the user types it here.
  const savedMobile = (sessionStorage.getItem("customerMobile") || "").trim();
  const [mobile, setMobile] = useState(savedMobile);

  // Status gate: can this mobile do step 3?
  // null = not checked yet, true = allowed, false = blocked
  const [allowed, setAllowed] = useState(savedMobile ? true : null);
  const [checking, setChecking] = useState(false);

  // If mobile came from registration, allow straight away (per your choice)
  useEffect(() => {
    if (savedMobile) setAllowed(true);
  }, [savedMobile]);

  // Check status for a typed mobile
  async function checkMobile() {
    setErr("");
    if (!/^\d{10}$/.test(mobile)) {
      return setErr("Enter your registered 10-digit mobile number.");
    }
    setChecking(true);
    try {
      const r = await api.checkStatus(mobile);
      if (!r.registered) {
        setErr("This mobile number is not registered. Please complete Step 1 (registration) first.");
        setAllowed(false);
      } else if (r.done) {
        // Whole process already complete -> show popup
        setAlreadyDone(true);
        setAllowed(false);
      } else {
        // Registered, proof pending -> allow step 3
        setAllowed(true);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  }

  async function submit() {
    setErr("");
    if (!/^\d{10}$/.test(mobile)) {
      return setErr("Enter your registered 10-digit mobile number.");
    }
    if (!screenshot) return setErr("Please upload a screenshot of your post.");

    const framed = sessionStorage.getItem("framedImage");
    if (!framed) {
      return setErr("Please complete Step 2 (create your branded frame) first.");
    }

    const fd = new FormData();
    fd.append("mobile", mobile);
    fd.append("screenshot", screenshot);

    const blob = await (await fetch(framed)).blob();
    fd.append("framedImage", new File([blob], "frame.png", { type: "image/png" }));

    setBusy(true);
    try {
      await api.submitProof(fd);
      setDone(true);
    } catch (e) {
      // If the backend says it's already complete, show the popup
      if (/already complete/i.test(e.message)) {
        setAlreadyDone(true);
      } else {
        setErr(e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  // ---- Already-complete popup ----
  if (alreadyDone) {
    return (
      <div className="wrap">
        <Link className="back" to="/">← Home</Link>
        <div className="card">
          <span className="eyebrow">Already complete</span>
          <h2>You're all done ✓</h2>
          <p className="lead">
            Your submission is already complete — you have finished all the steps.
            Now start your My Galaxy journey for gift redemption on the My Galaxy app.
          </p>
          <Link className="btn gold" to="/" style={{ textAlign: "center" }}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // ---- Success after submitting ----
  if (done) {
    return (
      <div className="wrap">
        <Link className="back" to="/">← Home</Link>
        <div className="card">
          <span className="eyebrow">All done</span>
          <h2>Thank you! 🎉</h2>
          <p className="lead">
            Now start your My Galaxy journey for gift redemption on the My Galaxy app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <Link className="back" to="/">← Home</Link>
      <span className="eyebrow">Step 3 of 3</span>
      <h1>Submit your social proof</h1>
      <p className="lead">Upload a screenshot of your posted frame to confirm participation.</p>

      <div className="card">
        {/* If mobile is not known yet, ask for it and check status */}
        {allowed !== true && (
          <>
            <label className="field">Registered mobile number *
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
              />
            </label>
            {err && <div className="alert err">{err}</div>}
            <button className="btn" onClick={checkMobile} disabled={checking}>
              {checking ? "Checking…" : "Continue"}
            </button>
          </>
        )}

        {/* Once allowed, show the upload */}
        {allowed === true && (
          <>
            <label className="field">Screenshot of your post *
              <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} />
            </label>
            {err && <div className="alert err">{err}</div>}
            <button className="btn gold" onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit proof"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}