/**
 * The single module that talks to the backend: JWT handling with silent refresh, a short GET cache,
 * and a data "version" that bumps after every write so any screen using useApi() refetches.
 */
const BASE = import.meta.env.VITE_API_URL || "/api/v1";
const K = { access: "ls_access", refresh: "ls_refresh" };
const TTL = 15_000;

const cache = new Map();
const listeners = new Set();
let version = 0;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const getVersion = () => version;
const bump = () => { cache.clear(); version += 1; listeners.forEach((l) => l()); };

export class ApiError extends Error {
  constructor(status, data) { super(`HTTP ${status}`); this.status = status; this.data = data; }
}

/** One readable sentence from a DRF error payload. */
export function errorMessage(err) {
  const d = err?.data;
  if (!d) return err?.message === "Failed to fetch" ? "Can't reach the server" : "Something went wrong";
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  const found = firstString(d);
  return found || "Please check the form and try again";
}
/** First human-readable string anywhere in a (possibly nested) DRF error payload. */
function firstString(x) {
  if (typeof x === "string") return x;
  if (Array.isArray(x)) { for (const v of x) { const s = firstString(v); if (s) return s; } return ""; }
  if (x && typeof x === "object") { for (const v of Object.values(x)) { const s = firstString(v); if (s) return s; } }
  return "";
}
/** Field errors as {field: message} for forms. */
export function fieldErrors(err) {
  const d = err?.data;
  if (!d || typeof d !== "object" || d.detail) return {};
  return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, [].concat(v)[0]?.toString?.() ?? ""]));
}

export const tokens = {
  get access() { return localStorage.getItem(K.access); },
  get refresh() { return localStorage.getItem(K.refresh); },
  set({ access, refresh }) {
    if (access) localStorage.setItem(K.access, access);
    if (refresh) localStorage.setItem(K.refresh, refresh);
  },
  clear() { localStorage.removeItem(K.access); localStorage.removeItem(K.refresh); },
};

let refreshing = null;
function refreshAccess() {
  refreshing ??= fetch(`${BASE}/auth/refresh/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async (r) => { if (!r.ok) throw new Error("refresh failed"); tokens.set(await r.json()); })
    .finally(() => { refreshing = null; });
  return refreshing;
}

async function request(path, { method = "GET", body, params, auth = true } = {}, retry = true) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => v !== "" && v != null && v !== false && url.searchParams.set(k, v));
  const key = url.toString() + (tokens.access ? "#auth" : "");
  if (method === "GET") {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.data;
  }
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });

  if (res.status === 401 && auth && retry && tokens.refresh) {
    try { await refreshAccess(); }
    catch { tokens.clear(); window.dispatchEvent(new Event("ls:logout")); throw new ApiError(401, { detail: "Session expired" }); }
    return request(path, { method, body, params, auth }, false);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  const data = res.status === 204 ? null : await res.json();
  if (method === "GET") cache.set(key, { at: Date.now(), data });
  else bump();
  return data;
}

const post = (path, body) => request(path, { method: "POST", body });

/* ------------------------------- service layer ------------------------------- */
export const auth = {
  async login(email, password) { tokens.set(await request("/auth/login/", { method: "POST", body: { email, password }, auth: false })); },
  register: (body) => request("/auth/register/", { method: "POST", body, auth: false }),
  async logout() {
    const refresh = tokens.refresh;
    if (refresh) await post("/auth/logout/", { refresh }).catch(() => {});
    tokens.clear(); cache.clear();
  },
};
export const me = {
  get: () => request("/me/"),
  patch: (body) => request("/me/", { method: "PATCH", body }),
  loans: (params) => request("/me/loans/", { params }),
  renew: (id) => post(`/me/loans/${id}/renew/`),
  holds: () => request("/me/holds/"),
  fines: () => request("/me/fines/"),
  notifications: () => request("/notifications/"),
};
export const works = {
  list: (params) => request("/works/", { params }),
  get: (id) => request(`/works/${id}/`),
  availability: (id) => request(`/works/${id}/availability/`),
  popular: () => request("/works/popular/"),
  create: (body) => post("/works/", body),
};
export const meta = {
  branches: () => request("/branches/"),
  resourceTypes: () => request("/resource-types/"),
  subjects: () => request("/subjects/"),
};
export const items = { create: (body) => post("/items/", body) };
export const loans = {
  list: (params) => request("/loans/", { params }),
  checkout: (member, item) => post("/loans/checkout/", { member, item }),
  checkin: (item) => post("/loans/checkin/", { item }),
  renew: (id) => post(`/loans/${id}/renew/`),
  markLost: (id) => post(`/loans/${id}/mark-lost/`),
};
export const holds = {
  list: (params) => request("/holds/", { params }),
  create: (body) => post("/holds/", body),
  cancel: (id) => request(`/holds/${id}/`, { method: "DELETE" }),
};
export const members = {
  list: (params) => request("/members/", { params }),
  lookup: (code) => request("/members/lookup/", { params: { code } }),
  create: (body) => post("/members/", body),
  approve: (id) => post(`/members/${id}/approve/`),
  suspend: (id) => post(`/members/${id}/suspend/`),
};
export const fines = { list: (params) => request("/fines/", { params }), waive: (id, reason) => post(`/fines/${id}/waive/`, { reason }) };
export const payments = { create: (body) => post("/payments/", body) };
export const reports = { get: (kind, params) => request(`/reports/${kind}/`, { params }) };
