// RUTA: frontend/src/lib/axiosAdmin.js
import axios from 'axios';

const apiAdmin = axios.create({
    // ✅ CORRECCIÓN: Se añade '/api' para que la ruta base sea la correcta
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