import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для добавления токена к запросам
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерсептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Если не удалось обновить токен - разлогиниваем
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;