import axios from 'axios';

// Get API URL from environment or use relative path
// In production, use relative path or set REACT_APP_API_URL
const getApiUrl = () => {
  // If running in Docker, use backend service name
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Try to detect if we're in Docker or local
  // For Docker: use backend service, for local: use localhost
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // If accessing via IP or domain, use that for API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Use same hostname but backend port
    return `${window.location.protocol}//${hostname}:18888`;
  }
  
  // Default for localhost
  return 'http://localhost:18888';
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
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

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

