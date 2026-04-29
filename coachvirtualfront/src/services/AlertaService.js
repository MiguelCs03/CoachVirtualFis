import api from "../api/api";

const ALERTAS = "/alertas/";
const USUARIOS = "/usuarios/";

// Endpoints de “mis alertas”
const MIS_ALERTAS = "/alertas/mis-alertas/";               // lista completa (solo las del usuario)
const MIS_ALERTAS_ULT = "/alertas/mis-alertas/ultimas/";   // solo nuevas con ?since=<id>

export const AlertaService = {
  // ---- Alertas (admin)
  list(params) {
    return api.get(ALERTAS, { params }).then((r) => r.data);
  },
  get(id) {
    return api.get(`${ALERTAS}${id}/`).then((r) => r.data);
  },
  create(payload) {
    // payload: { mensaje, fecha, usuario?, estado? }
    return api.post(ALERTAS, payload).then((r) => r.data);
  },
  update(id, payload) {
    return api.put(`${ALERTAS}${id}/`, payload).then((r) => r.data);
  },
  remove(id) {
    return api.delete(`${ALERTAS}${id}/`);
  },

  // ---- Solo mis alertas (usuario autenticado)
  listMine() {
    return api.get(MIS_ALERTAS).then((r) => r.data);
  },

  // ---- Mis alertas desde cierto ID (para notificaciones)
  listMineSince(sinceId) {
    const params = sinceId ? { since: sinceId } : undefined;
    return api.get(MIS_ALERTAS_ULT, { params }).then((r) => r.data);
  },

  // ---- Usuarios (para select en admin)
  listUsers() {
    return api.get(USUARIOS).then((r) => r.data);
  },
};
