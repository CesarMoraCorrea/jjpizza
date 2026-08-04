import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL_ORDERS || 'http://localhost:5000/api/orders';

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

  // Obtener todos los pedidos (requiere Staff o Admin)
  getOrders: async () => {
    const response = await api.get('/');
    return response.data;
  },

  // Actualizar el estado de cocina, estado de pago y/o método de pago
  updateOrderStatus: async (id, status, paymentMethod, paymentStatus) => {
    const payload = {};
    if (typeof status === 'object' && status !== null) {
      Object.assign(payload, status);
    } else {
      if (status) payload.status = status;
      if (paymentMethod) payload.paymentMethod = paymentMethod;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
    }
    const response = await api.put(`/${id}/status`, payload);
    return response.data;
  }
};

export default orderService;
