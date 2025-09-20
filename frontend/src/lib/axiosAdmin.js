// RUTA: frontend/src/lib/axiosAdmin.js
import axios from 'axios';

const apiAdmin = axios.create({
    // ✅ URL de producción directa y completa para admin
    baseURL: 'https://mix-rastros-de-esperanza.onrender.com/api/admin',
});

apiAdmin.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiAdmin;