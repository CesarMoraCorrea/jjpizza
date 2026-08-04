import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL_SHIFTS || 'http://localhost:5000/api/shifts';

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

  // Abrir turno de caja con fondo inicial
  openShift: async (initialCash) => {
    const response = await api.post('/open', { initialCash });
    return response.data;
  },

  // Cerrar turno de caja y realizar arqueo auditado
  closeShift: async (declaredData) => {
    const response = await api.post('/close', declaredData);
    return response.data;
  },

  // Obtener historial de cierres auditados (Admin)
  getShiftHistory: async () => {
    const response = await api.get('/history');
    return response.data;
  }
};

export default shiftService;
