import axios from 'axios';
import { getApiUrl } from './apiConfig';

const API_URL = getApiUrl('/orders');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar Token de sesión en la API de Pedidos
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

export const orderService = {
  // Crear un pedido (público o autenticado)
  createOrder: async (orderData) => {
    const response = await api.post('/', orderData);
    return response.data;
  },

  // Obtener todos los pedidos
  getOrders: async () => {
    const response = await api.get('/');
    return response.data;
  },

  // Actualizar el estado de cocina o estado de pago de un pedido
  updateOrderStatus: async (id, statusData) => {
    // Normalizar automáticamente si el parámetro viene como string simple (ej: 'preparing')
    const payload = typeof statusData === 'string' ? { status: statusData } : statusData;
    const response = await api.put(`/${id}/status`, payload);
    return response.data;
  }
};

export default orderService;
