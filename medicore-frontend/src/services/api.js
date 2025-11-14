import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, StorageManager } from '../utils/constants';

const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = StorageManager.getToken();
    
    console.log(`🔍 [API] ${config.method.toUpperCase()} ${config.url}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`   ✅ Token added to headers`);
    } else {
      console.log(`   ⚠️  No token found`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    console.error(`❌ [API] ${status} Error:`, data);
    
    // Handle 401 Unauthorized
    if (status === 401) {
      console.log('🔄 [API] Token invalid/expired. Clearing storage and redirecting...');
      StorageManager.clearAll();
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      console.error('🚫 [API] Access denied');
    }
    
    // Handle 422 Validation Error
    if (status === 422) {
      console.error('⚠️  [API] Validation error:', data.detail);
    }
    
    return Promise.reject(error);
  }
);

export default api;
