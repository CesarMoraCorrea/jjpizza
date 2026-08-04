// Helper centralizado para resolver la URL base del servidor API
export const getBaseServerUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  // Limpia cualquier sufijo /api/... si fue proporcionado por error
  return envUrl.replace(/\/api(\/.*)?$/, '').replace(/\/$/, '');
};

export const getApiUrl = (endpoint) => {
  const base = getBaseServerUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}/api${cleanEndpoint}`;
};
