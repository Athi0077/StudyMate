import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://studymate-wbb6.onrender.com/api',
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

// Add a response interceptor to handle expired sessions and temp access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        window.location.href = '/login';
      }
    }
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
