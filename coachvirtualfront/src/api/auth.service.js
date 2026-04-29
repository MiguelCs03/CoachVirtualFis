// src/api/auth.service.js
import api from "../api/api";

// Servicio de auth compatible con SimpleJWT (access/refresh).
// Persiste tokens en localStorage y siempre consulta /usuarios/me/ para obtener flags.

const ME_URL = import.meta.env.VITE_ME_URL || "/usuarios/me/"; // ⬅️ por defecto

let accessToken = null;
let refreshToken = null;

export function setAccessToken(token) { accessToken = token || null; }
export function getAccessToken() { return accessToken; }

function saveTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  accessToken = null; refreshToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function restoreTokensFromStorage() {
  const a = localStorage.getItem("access_token");
  const r = localStorage.getItem("refresh_token");
  if (a) accessToken = a;
  if (r) refreshToken = r;
  return { accessToken: a, refreshToken: r };
}

// --- fallback por si ME fallara (no se usa si ME funciona) ---
function b64UrlDecode(str) {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
}
function userFromAccess(token, fallbackEmail) {
  if (!token) return null;
  const payload = b64UrlDecode((token || "").split(".")[1] || "");
  const id = payload?.user_id ?? payload?.sub ?? null;
  const email = payload?.email ?? fallbackEmail ?? null;
  return id ? { id, email } : (email ? { id: null, email } : null);
}

export const authService = {
  // SimpleJWT login (POST /api/token/)
  async login(email, password) {
    // data: { access, refresh, (opcional user) }
    const { data } = await api.post("/token/", { email, password });
    saveTokens(data?.access, data?.refresh);

    // SIEMPRE intenta traer el perfil real con flags (is_superuser)
    let user = null;
    try {
      const me = await api.get(ME_URL);
      user = me?.data ?? null; // ← incluye is_superuser
    } catch {
      // fallback ultra-minimo (no trae is_superuser)
      user = userFromAccess(data?.access, email);
    }
    return { user, accessToken, refreshToken };
  },

  async me() {
    try {
      const { data } = await api.get(ME_URL); // ← incluye is_superuser
      return data;
    } catch {
      // fallback si ME falla
      return userFromAccess(accessToken, null);
    }
  },

  async logout() {
    try { await api.post("/auth/logout/"); } catch {}
    clearTokens();
  },
};
