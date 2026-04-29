
import api, { getUserIdFromAnyToken } from "../api/api";

const BASE = "/usuarios/";

export function sanitizeForPut(obj = {}) {
  const clone = { ...obj };
  [
    "id",
    "pk",
    "is_superuser",
    "is_staff",
    "last_login",
    "date_joined",
    "created_at",
    "updated_at",
    "groups",
    "user_permissions",
    "password", 
  ].forEach((k) => delete clone[k]);
  return clone;
}

export function getMyUserId() {
  const uid = getUserIdFromAnyToken?.();
  if (!uid) throw new Error("No autenticado. Inicia sesión.");
  return uid;
}

export async function fetchUserById(id) {
  const { data } = await api.get(`${BASE}${id}/`);
  return data;
}

export async function fetchMyProfile() {
  const uid = getMyUserId();
  return fetchUserById(uid);
}

export async function updateUser(id, payload, options = {}) {
  const { mergeWith = null, sanitize = true } = options;
  let body = payload;

  if (mergeWith) body = { ...mergeWith, ...payload };
  if (sanitize) body = sanitizeForPut(body);

  const { data } = await api.put(`${BASE}${id}/`, body);
  return data;
}


export async function updateMyProfile(payload, options = {}) {
  const uid = getMyUserId();
  return updateUser(uid, payload, options);
}


export async function createUser(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function listUsers(params = {}) {
  const { data } = await api.get(BASE, { params });
  const results = Array.isArray(data) ? data : data.results || [];
  return {
    results,
    count: data.count ?? results.length,
    next: data.next ?? null,
    previous: data.previous ?? null,
    raw: data,
  };
}

export async function deleteUser(id) {
  await api.delete(`${BASE}${id}/`);
  return true;
}

export function buildUserPayload(form = {}, { omitPasswordIfEmpty = true } = {}) {
  const payload = {
    email: form.email?.trim?.() ?? form.email,
    username: form.username?.trim?.() ?? form.username,
    first_name: form.first_name?.trim?.() ?? form.first_name ?? form.nombre ?? "",
    last_name: form.last_name?.trim?.() ?? form.last_name ?? form.apellido ?? "",
    fecha_nacimiento: form.fecha_nacimiento || null,
    genero: form.genero ?? "",
    altura: typeof form.altura === "string" ? form.altura.trim() : form.altura ?? "",
    peso: typeof form.peso === "string" ? form.peso.trim() : form.peso ?? "",
  };

  if (!omitPasswordIfEmpty || (form.password && form.password.trim())) {
    payload.password = form.password.trim();
  }

  if (form.avatar && String(form.avatar).trim() !== "") {
    payload.avatar = String(form.avatar).trim();
  }

  return payload;
}

export function ensureArray(data) {
  return Array.isArray(data) ? data : (data?.results || []);
}
