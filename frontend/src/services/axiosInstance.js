import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: Handle 401 Unauthorized globally
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Avoid redirecting if we are already on login/register to prevent loops
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          // Could dispatch a logout action or clear local storage here
          // localStorage.removeItem('token');
          // localStorage.removeItem('user');
          // window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
