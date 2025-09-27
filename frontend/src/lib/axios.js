// RUTA: frontend/src/lib/axios.js
import axios from 'axios';

const api = axios.create({
    // ✅ Lee la URL base desde las variables de entorno de Vite
    baseURL: 'https://hasta-encontrarte-backend.fly.dev/api', 
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('AUTH_TOKEN');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;