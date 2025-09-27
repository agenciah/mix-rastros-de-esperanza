// RUTA: frontend/src/lib/axiosAdmin.js
import axios from 'axios';

const apiAdmin = axios.create({
    baseURL: `https://hasta-encontrarte-backend-c5aaf60bf144.herokuapp.com/api/admin`, // ✅ REEMPLAZA CON TU URL DE HEROKU
});

apiAdmin.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiAdmin;