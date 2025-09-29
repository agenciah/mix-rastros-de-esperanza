// RUTA: frontend/src/lib/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://hasta-encontrarte-backend-fe5f73c970ea.herokuapp.com/api', // ✅ REEMPLAZA CON TU URL DE HEROKU
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