// RUTA: frontend/src/lib/axios.js
import axios from 'axios';

const api = axios.create({
    // ✅ URL de producción directa, incluyendo /api
    baseURL: 'https://mix-rastros-de-esperanza.onrender.com', 
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