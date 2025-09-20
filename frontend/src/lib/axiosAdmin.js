// RUTA: frontend/src/lib/axiosAdmin.js

import axios from 'axios';

// ✅ Usamos la misma lógica para determinar el entorno
const baseURL = import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_ADMIN_API_URL  // URL de Render (definida en GitHub Secrets)
    : 'http://localhost:3001/api/admin';      // URL para desarrollo local

const apiAdmin = axios.create({
    baseURL: baseURL,
});

apiAdmin.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiAdmin;