const BASE = import.meta.env.VITE_API_BASE || "";

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  // ---- public ----
  register: (body) =>
    fetch(`${BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  uploadFrameImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return fetch(`${BASE}/api/frame/upload`, { method: "POST", body: fd }).then(handle);
  },

  requestOtp: (mobile) =>
    fetch(`${BASE}/api/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    }).then(handle),

  verifyOtp: (body) =>
    fetch(`${BASE}/api/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  submitProof: (fd) =>
    fetch(`${BASE}/api/submit`, { method: "POST", body: fd }).then(handle),

  // ---- admin ----
  adminLogin: (body) =>
    fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  adminGet: (path, token) =>
    fetch(`${BASE}/api/admin${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(handle),

  exportUrl: (path) => `${BASE}/api/admin${path}`,
};