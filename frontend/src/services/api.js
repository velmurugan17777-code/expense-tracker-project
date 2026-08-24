import axios from 'axios';

// Use environment variable for API base URL (set VITE_API_URL in .env or Render dashboard)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create Axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    // Endpoints that should not include the Authorization header
    const noAuthEndpoints = [
      '/accounts/login/', 
      '/accounts/register/', 
      '/accounts/token/refresh/', 
      '/accounts/verify-otp/', 
      '/accounts/resend-otp/', 
      '/accounts/request-password-reset/', 
      '/accounts/confirm-password-reset/'
    ];
    
    const requiresAuth = !noAuthEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (requiresAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 Unauthorized errors globally and unpack data wrapper
api.interceptors.response.use(
  (response) => {
    // If the backend wraps the response in our custom format (success, message, data, errors)
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        // Replace the response data with the nested data so existing components don't break
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Attempt to refresh the token
          const res = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          
          if (res.status === 200) {
            // Save new access token
            localStorage.setItem('access_token', res.data.access);
            // Retry the original request
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (_refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // Format error so components receive standard structure
    if (error.response && error.response.data && 'success' in error.response.data) {
      // The backend returned our custom wrapper
      // If it's a validation error, we might want to attach it to detail
      const errData = error.response.data;
      if (!errData.success && errData.errors) {
        // Fallback for components that expect err.response.data.detail
        errData.detail = errData.message;
        
        // If there are specific field errors, stringify them or provide them directly
        // Some components might look for err.response.data.detail
        // Keep the original object structure but replace response.data with errData.errors
        error.response.data = { detail: errData.message, ...errData.errors };
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
