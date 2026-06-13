import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api.js";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function login() {
    setErr("");
    setBusy(true);
    try {
      const r = await api.adminLogin({ email, password });
      sessionStorage.setItem("adminToken", r.token);
      sessionStorage.setItem("adminEmail", r.email);
      nav("/admin/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <Link className="back" to="/">← Home</Link>
      <span className="eyebrow">Backend access</span>
      <h1>Admin login</h1>

      <div className="card">
        <label className="field">Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
        </label>
        <label className="field">Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()} placeholder="••••••••" />
        </label>
        {err && <div className="alert err">{err}</div>}
        <button className="btn" onClick={login} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
