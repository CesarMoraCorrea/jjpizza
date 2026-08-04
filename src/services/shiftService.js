import axios from 'axios';
import { getApiUrl } from './apiConfig';

const API_URL = getApiUrl('/shifts');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar Token de sesión en la API de Turnos de Caja
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jjpizza_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const shiftService = {
  // Obtener turno activo de caja
  getActiveShift: async () => {
    const response = await api.get('/active');
    return response.data;
  },

  // Abrir turno de caja
  openShift: async (initialCash) => {
    const response = await api.post('/open', { initialCash });
    return response.data;
  },

  // Arqueo y Cierre Diario de caja
  closeShift: async (declaredTotals) => {
    const response = await api.post('/close', declaredTotals);
    return response.data;
  },

  // Consultar historial de turnos cerrados
  getHistory: async () => {
    const response = await api.get('/history');
    return response.data;
  }
};

export default shiftService;
