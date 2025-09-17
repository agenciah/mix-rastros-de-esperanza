// RUTA: frontend/hooks/useHallazgos.js

import { useState, useCallback, useEffect } from 'react';
import api from '../lib/axios'; // Ajusta la ruta a tu instancia de axios
import { useAuth } from '@/context/AuthContext'; // Ajusta la ruta a tu contexto

/**
 * Hook de Datos para Hallazgos.
 * @param {object} options - Opciones de configuración.
 * @param {boolean} [options.fetchOnMount=false] - Si es true, carga los hallazgos del usuario al montar.
 */
export const useHallazgos = (options = { fetchOnMount: false }) => {
    const { user, isAuthLoading } = useAuth();
    
    const [hallazgos, setHallazgos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- FUNCIONES DE LECTURA (GET) ---

    const fetchHallazgos = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/hallazgos/by-user');
            setHallazgos(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar tus hallazgos.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (options.fetchOnMount && !isAuthLoading && user) {
            fetchHallazgos();
        }
    }, [options.fetchOnMount, isAuthLoading, user, fetchHallazgos]);

    const getHallazgoById = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/hallazgos/${id}`);
            return response.data.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar el detalle.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);
    const createHallazgo = useCallback(async (hallazgoData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/hallazgos', hallazgoData);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al crear el hallazgo.';
            setError(errorMsg);
            console.error("❌ Error creando hallazgo:", err);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const actualizarHallazgo = useCallback(async (id, updatedData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.put(`/api/hallazgos/${id}`, updatedData);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al actualizar el hallazgo.';
            setError(errorMsg);
            console.error(`❌ Error actualizando hallazgo ${id}:`, err);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const eliminarHallazgo = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.delete(`/api/hallazgos/${id}`);
            // Ya no recargamos automáticamente, el componente decidirá si hacerlo.
            return { success: true, data: response.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al eliminar el hallazgo.';
            setError(errorMsg);
            console.error(`❌ Error eliminando hallazgo ${id}:`, err);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        hallazgos,
        isLoading,
        error,
        fetchHallazgos,
        getHallazgoById,
        createHallazgo,
        actualizarHallazgo,
        eliminarHallazgo,
    };
};