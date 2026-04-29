// src/services/EjercicioAsignadoService.js
import api from '../api/api';

const API_URL = '/ejercicios-asignados/';

const EjercicioAsignadoService = {
  getAll: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_URL}${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_URL, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${API_URL}${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_URL}${id}/`);
    return response.data;
  },
};

export default EjercicioAsignadoService;
