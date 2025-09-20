// RUTA: frontend/src/lib/axios.js

import axios from 'axios';

// ✅ En Vite, se usa 'import.meta.env.MODE' para saber si estamos en producción.
const baseURL = import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_BASE_URL  // URL de Render (definida en GitHub Secrets)
    : 'http://localhost:3001';          // URL para desarrollo local

const api = axios.create({
    baseURL: baseURL,
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