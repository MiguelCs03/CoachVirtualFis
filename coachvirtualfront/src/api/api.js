// src/api/api.js aqui
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ---------- helpers ----------
export const getTokens = () => ({
  access: localStorage.getItem("access_token") || null,
  refresh: localStorage.getItem("refresh_token") || null,
});

function decodePayload(jwt) {
  try {
    const base64Url = jwt.split(".")[1] || "";
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
}

function isExpired(token) {
  const p = decodePayload(token);
  if (!p?.exp) return false;
  // refresca unos segundos antes para evitar carreras
  return Math.floor(Date.now() / 1000) >= (p.exp - 10);
}

export const getUserIdFromAnyToken = () => {
  const { access, refresh } = getTokens();
  const p = access ? decodePayload(access) : (refresh ? decodePayload(refresh) : null);
  return p?.user_id ?? p?.sub ?? null;
};

// ---------- request: añade Authorization y refresca si expira ----------
api.interceptors.request.use(async (config) => {
  if (!config.headers) config.headers = {};

  const { access, refresh } = getTokens();

  // Si hay access expirado y refresh disponible → refrescamos antes
  if (access && refresh && isExpired(access)) {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh });
      if (data?.access) localStorage.setItem("access_token", data.access);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  const current = localStorage.getItem("access_token");
  if (current) config.headers.Authorization = `Bearer ${current}`;

  return config;
});

// ---------- response: si 401, intenta refresh y reintenta UNA vez ----------
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh });
          if (data?.access) {
            localStorage.setItem("access_token", data.access);
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${data.access}`;
            return api.request(original);
          }
        } catch {
          // si falla el refresh, limpiamos y propagamos el error
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
