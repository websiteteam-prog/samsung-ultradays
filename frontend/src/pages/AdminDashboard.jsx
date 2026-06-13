import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api.js";

export default function AdminDashboard() {
  const nav = useNavigate();
  const token = sessionStorage.getItem("adminToken");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [err, setErr] = useState("");

  const qs = useCallback(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [from, to]);

  const load = useCallback(async () => {
    setErr("");
    try {
      const [s, data] = await Promise.all([
        api.adminGet("/summary", token),
        api.adminGet(`/submissions${qs()}`, token),
      ]);
      setSummary(s);
      setRows(data);
    } catch (e) {
      setErr(e.message);
      if (/token/i.test(e.message)) { sessionStorage.clear(); nav("/admin"); }
    }
  }, [token, qs, nav]);

  useEffect(() => {
    if (!token) { nav("/admin"); return; }
    load();
  }, [token, nav, load]);

  function logout() { sessionStorage.clear(); nav("/admin"); }

  function clearFilter() { setFrom(""); setTo(""); }

  function exportCsv() {
    fetch(api.exportUrl(`/export/submissions${qs()}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "submissions.csv"; a.click();
        URL.revokeObjectURL(url);
      });
  }

  const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <div className="wrap" style={{ maxWidth: 1100 }}>
      <div className="admin-head">
        <div className="brand"><span className="dot" /> Admin panel</div>
        <button className="btn ghost" style={{ width: "auto", marginTop: 0, padding: "10px 16px" }}
          onClick={logout}>Log out</button>
      </div>

      {err && <div className="alert err">{err}</div>}

      {summary && (
        <div className="stat-grid">
          <div className="stat"><div className="v">{summary.registrations}</div><div className="l">Registrations</div></div>
          <div className="stat"><div className="v">{summary.submissions}</div><div className="l">Completed submissions</div></div>
          <div className="stat"><div className="v">{summary.pending}</div><div className="l">Registered, not submitted</div></div>
          <div className="stat"><div className="v">{rows.length}</div><div className="l">Showing (filtered)</div></div>
        </div>
      )}

      <div className="filter-bar">
        <div>
          <label>From</label><br />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label>To</label><br />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn" onClick={load}>Apply</button>
        <button className="btn ghost" onClick={() => { clearFilter(); setTimeout(load, 0); }}>Clear</button>
        <button className="btn gold" onClick={exportCsv} style={{ marginLeft: "auto" }}>⬇ Export CSV</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>Name</th><th>Mobile</th><th>IMEI</th><th>Email</th>
            <th>City</th><th>Store</th><th>SES ID / Manager</th><th>Product</th><th>Verified</th>
            <th>Screenshot</th><th>Frame</th><th>Registered</th><th>Submitted</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name || "—"}</td>
                <td>{r.mobile}</td>
                <td>{r.imei || "—"}</td>
                <td>{r.email || "—"}</td>
                <td>{r.city || "—"}</td>
                <td>{r.storeLocation || "—"}</td>
                <td>{r.sesId || "—"}</td>
                <td>{r.productPurchased || "—"}</td>
                <td>{r.verified ? "Yes" : "No"}</td>
                <td>{r.screenshotUrl ? <a href={r.screenshotUrl} target="_blank" rel="noreferrer"><img className="thumb" src={r.screenshotUrl} alt="" /></a> : "—"}</td>
                <td>{r.framedImageUrl ? <a href={r.framedImageUrl} target="_blank" rel="noreferrer"><img className="thumb" src={r.framedImageUrl} alt="" /></a> : "—"}</td>
                <td>{fmt(r.registeredAt)}</td>
                <td>{fmt(r.submittedAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="14" style={{ color: "var(--text-dim)" }}>No submissions in this range.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}