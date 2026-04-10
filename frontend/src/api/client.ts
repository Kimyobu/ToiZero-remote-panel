import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Inject session cookie header on every request
api.interceptors.request.use((config) => {
  const cookie = localStorage.getItem('toi_session_cookie');
  if (cookie) {
    config.headers['x-session-cookie'] = cookie;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch custom event so app can handle
      window.dispatchEvent(new CustomEvent('toi:session-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
