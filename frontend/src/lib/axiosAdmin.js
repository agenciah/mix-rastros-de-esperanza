// RUTA: frontend/src/lib/axiosAdmin.js
import axios from 'axios';

const apiAdmin = axios.create({
    // ✅ Construye la URL de admin a partir de la URL base
    baseURL: `https://hasta-encontrarte-backend.fly.dev/api/admin`,
});

apiAdmin.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiAdmin;