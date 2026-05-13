import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const jwtToken = localStorage.getItem('accessToken');
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    // must return config
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.error('No autorizado. Por favor, inicie sesión nuevamente.');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          break;
        case 500:
          console.error('Error interno del servidor. Intente más tarde.');
          break;
        default:
          console.error('Ocurrió un error:', error.response.status);
      }
    } else if (error.request) {
      // Error de red (sin respuesta del servidor)
      console.error('Error de red:', error.request);
    }

    return Promise.reject(error);
  }
);

export default api;
