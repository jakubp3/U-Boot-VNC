import axios from 'axios';

// Get API URL from environment or use relative path
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Use same hostname but backend port (18888)
  // This works for both localhost and network IPs
  const apiUrl = `${protocol}//${hostname}:18888`;
  
  console.log('API URL:', apiUrl);
  return apiUrl;
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

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network errors for debugging
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

