import axios from 'axios';
import { getApiUrl } from './apiConfig';

const API_URL = getApiUrl('/inventory');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar Token de sesión en la API de Inventario
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

export const inventoryService = {
  // Obtener todos los insumos
  getSupplies: async () => {
    const response = await api.get('/supplies');
    return response.data;
  },

  // Agregar un insumo
  addSupply: async (supplyData) => {
    const response = await api.post('/supplies', supplyData);
    return response.data;
  },

  // Actualizar un insumo
  updateSupply: async (id, supplyData) => {
    const response = await api.put(`/supplies/${id}`, supplyData);
    return response.data;
  },

  // Obtener todos los productos
  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  // Agregar un producto (simple o compuesto)
  addProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Actualizar un producto
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Actualizar stock de un insumo o producto simple
  updateStock: async (id, type, stock) => {
    const response = await api.put('/stock', { id, type, stock });
    return response.data;
  },

  // Obtener historial de movimientos
  getMovements: async () => {
    const response = await api.get('/movements');
    return response.data;
  },

  // Crear un nuevo movimiento
  createMovement: async (movementData) => {
    const response = await api.post('/movements', movementData);
    return response.data;
  },

  // Registrar compra en lote (Factura)
  registerBatchPurchase: async (batchData) => {
    const response = await api.post('/movements/batch-purchase', batchData);
    return response.data;
  },

  // Registrar ajuste de inventario en lote (Conteo Físico)
  registerBatchAdjustment: async (batchData) => {
    const response = await api.post('/movements/batch-adjustment', batchData);
    return response.data;
  },

  // Registrar una venta en POS
  registerSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  }
};

export default inventoryService;
