// RUTA: frontend/hooks/useFichas.js

import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export const useFichas = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Función Auxiliar para Peticiones GET ---
    const _handleGetRequest = async (requestCallback) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await requestCallback();
            return response.data.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Ocurrió un error.';
            setError(errorMsg);
            console.error("❌ Error en GET request de useFichas:", err);
            return null; // Devuelve null en caso de error
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- FUNCIONES DE LECTURA (GET) ---
    const getMisFichas = useCallback(() => _handleGetRequest(() => api.get('/api/fichas/mis-fichas')), []);
    const getFichaById = useCallback((id) => _handleGetRequest(() => api.get(`/api/fichas/${id}`)), []);
    const getFichasFeed = useCallback((page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return _handleGetRequest(() => api.get(`/fichas/publicas/feed?limit=${limit}&offset=${offset}`));
    }, []);
    const searchFichas = useCallback((searchTerm, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return _handleGetRequest(() => api.get(`/fichas/publicas/search?searchTerm=${searchTerm}&limit=${limit}&offset=${offset}`));
    }, []);


    // --- FUNCIONES DE ESCRITURA (CREATE, UPDATE, DELETE) ---

    // ✅ FUNCIÓN `createFicha` AÑADIDA
    const createFicha = useCallback(async (fichaData) => {
        setIsLoading(true);
        setError(null);
        try {
            // No devuelve datos, solo la respuesta completa de Axios
            return await api.post('/fichas', fichaData);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear la ficha.');
            throw err; // Lanza el error para que handleSubmit lo atrape
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✅ FUNCIÓN `updateFicha` AÑADIDA
    const updateFicha = useCallback(async (id, fichaData) => {
        setIsLoading(true);
        setError(null);
        try {
            return await api.put(`/fichas/${id}`, fichaData);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar la ficha.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const eliminarFicha = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.delete(`/fichas/${id}`);
            toast.success("Ficha eliminada correctamente.");
            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al eliminar la ficha.';
            setError(errorMsg);
            toast.error(errorMsg);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✅ EXPORTAMOS TODAS LAS FUNCIONES NECESARIAS
    return { 
        isLoading, 
        error, 
        getMisFichas, 
        getFichaById, 
        getFichasFeed, 
        searchFichas,
        createFicha,
        updateFicha,
        eliminarFicha 
    };
};