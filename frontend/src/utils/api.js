import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle expired temp access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data?.message === "Access denied") {
      const isPrincipalRoute = window.location.pathname.startsWith('/principal');
      if (isPrincipalRoute) {
        window.location.href = '/teacher/dashboard?tempExpired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
