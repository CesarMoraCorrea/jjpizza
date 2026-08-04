import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL_AUTH || 'http://localhost:5000/api/auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar Token de sesión en todas las solicitudes
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

export const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    if (response.data.success && response.data.token) {
      localStorage.setItem('jjpizza_token', response.data.token);
      localStorage.setItem('jjpizza_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('jjpizza_token');
    localStorage.removeItem('jjpizza_user');
  },

  // Obtener usuario actualmente autenticado en localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('jjpizza_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  // Obtener Token JWT activo
  getToken: () => {
    return localStorage.getItem('jjpizza_token');
  },

  // Verificadores de Rol RBAC
  isAuth: () => {
    return !!localStorage.getItem('jjpizza_token');
  },

  isStaff: () => {
    const user = authService.getCurrentUser();
    return !!user && (user.role === 'staff' || user.role === 'admin');
  },

  isAdmin: () => {
    const user = authService.getCurrentUser();
    return !!user && user.role === 'admin';
  }
};

export default authService;
