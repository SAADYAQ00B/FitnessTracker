import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Normalize baseURL to ensure it targets the API prefix
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
});

let activeRequests = 0;

const notifyLoadingState = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('api-loading-change', { detail: activeRequests > 0 })
    );
  }
};

// Request interceptor: Attach JWT Bearer token & track active requests
api.interceptors.request.use(
  (config) => {
    activeRequests++;
    notifyLoadingState();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure browser sets exact multipart/form-data boundary with FormData
    if (config.data instanceof FormData || (config.data && typeof config.data.append === 'function')) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyLoadingState();
    return Promise.reject(error);
  }
);

// Response interceptor: Decrement active requests & handle unauthenticated responses
api.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyLoadingState();
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyLoadingState();

    if (error.response && error.response.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
