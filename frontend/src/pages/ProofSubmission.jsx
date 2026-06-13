import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api.js";

export default function ProofSubmission() {
  const [screenshot, setScreenshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // Mobile comes from the registration step (no need to ask again)
  const mobile = (sessionStorage.getItem("customerMobile") || "").trim();

  async function submit() {
    setErr("");
    if (!/^\d{10}$/.test(mobile)) {
      return setErr("We couldn't find your registered mobile. Please complete Step 1 (registration) first.");
    }
    if (!screenshot) return setErr("Please upload a screenshot of your post.");

    const fd = new FormData();
    fd.append("mobile", mobile);
    fd.append("screenshot", screenshot);

    const framed = sessionStorage.getItem("framedImage");
    if (framed) {
      const blob = await (await fetch(framed)).blob();
      fd.append("framedImage", new File([blob], "frame.png", { type: "image/png" }));
    }

    setBusy(true);
    try {
      await api.submitProof(fd);
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
        {!mobile && (
          <div className="alert err">
            Please complete Step 1 (registration) first so we can link your submission.
          </div>
        )}

        <label className="field">Screenshot of your post *
          <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} />
        </label>

        {err && <div className="alert err">{err}</div>}

        <button className="btn gold" onClick={submit} disabled={busy || !mobile}>
          {busy ? "Submitting…" : "Submit proof"}
        </button>
      </div>
    </div>
  );
}