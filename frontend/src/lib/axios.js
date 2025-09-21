// RUTA: frontend/src/lib/axios.js
import axios from 'axios';

const api = axios.create({
    // ✅ CORRECCIÓN: Se añade '/api' al final
    baseURL: 'https://mix-rastros-de-esperanza.onrender.com/api', 
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