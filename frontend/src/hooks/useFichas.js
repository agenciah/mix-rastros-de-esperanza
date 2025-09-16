// RUTA: frontend/hooks/useFichas.js

import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export const useFichas = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const _handleRequest = async (request) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await request();
            return response.data.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Ocurrió un error.';
            setError(errorMsg);
            console.error("❌ Error en hook useFichas:", err);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const getMisFichas = useCallback(() => _handleRequest(() => api.get('/api/fichas/mis-fichas')), []);
    const getFichaById = useCallback((id) => _handleRequest(() => api.get(`/api/fichas/${id}`)), []);
    
    const getFichasFeed = useCallback((page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return _handleRequest(() => api.get(`/api/fichas/publicas/feed?limit=${limit}&offset=${offset}`));
    }, []);

    const searchFichas = useCallback((searchTerm, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return _handleRequest(() => api.get(`/api/fichas/publicas/search?searchTerm=${searchTerm}&limit=${limit}&offset=${offset}`));
    }, []);

    const eliminarFicha = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.delete(`/api/fichas/${id}`);
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

    return { isLoading, error, getMisFichas, getFichaById, getFichasFeed, searchFichas, eliminarFicha };
};