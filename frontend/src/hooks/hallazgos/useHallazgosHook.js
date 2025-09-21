import { useState, useCallback, useEffect } from 'react';
import api from '../../lib/axios';
import { useAuth } from '@/context/AuthContext';

/**
 * @fileoverview Hook para manejar todas las interacciones con la API de Hallazgos.
 * Centraliza las funciones del CRUD y la búsqueda, proporcionando un estado de carga y error.
 */
export const useHallazgos = () => {
    const { user, isAuthLoading: authLoading } = useAuth();
    
    const [hallazgos, setHallazgos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // *** NUEVO console.log para ver el estado del usuario al inicio del hook ***
    console.log('✅ Estado del hook useHallazgos:');
    console.log(`- authLoading: ${authLoading}`);
    console.log(`- user: ${user ? user.id_usuario : 'No logueado'}`);

     /**
     * Obtiene los hallazgos del usuario autenticado.
     */
    const fetchHallazgos = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // *** console.log antes de la llamada a la API ***
        console.log("🚀 Iniciando solicitud para obtener hallazgos del usuario...");
        try {
            // Cambiar la URL para llamar a la nueva ruta
            const response = await api.get('/hallazgos/by-user');
            // *** console.log después de una solicitud exitosa ***
            console.log("✅ Solicitud exitosa. Datos recibidos:", response.data.data);
            setHallazgos(response.data.data);
        } catch (err) {
            // Este console.error ya lo tenías, pero es clave para la depuración
            console.error("❌ Error al obtener los hallazgos del usuario:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al cargar tus hallazgos.');
            setHallazgos([]);
        } finally {
            setIsLoading(false);
            console.log("🏁 Solicitud finalizada.");
        }
    }, []);

    // Lógica para que el hook solo se ejecute cuando el usuario esté cargado
    useEffect(() => {
    console.log('➡️ useEffect del hook activado.');

    // Condición de carga: No hacer nada si aún estamos cargando la autenticación
    if (authLoading) {
        console.log('⏳ Esperando a que el usuario termine de cargar la sesión...');
        return;
    }

    // Condición de éxito: Si el usuario existe, llamar a fetchHallazgos
    if (user?.id) {
        console.log('✅ Usuario logueado (ID:', user.id, '). Llamando a fetchHallazgos...');
        fetchHallazgos();
    } else {
        // Condición de error/no-logueado: No hay usuario, no se hace el fetch
        console.log('🛑 No hay usuario logueado. Cancelando el fetch de hallazgos.');
        // Opcional: podrías establecer los hallazgos a un array vacío si quieres
        // setHallazgos([]);
    }

}, [fetchHallazgos, authLoading, user]); // Dependencias correctas

    /**
     * Obtiene un hallazgo por su ID.
     */
    const getHallazgoById = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/hallazgos/${id}`);
            return response.data.data;
        } catch (err) {
            console.error(`❌ Error al obtener hallazgo con ID ${id}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al obtener el hallazgo.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createHallazgo = useCallback(async (hallazgoData) => {
        setIsLoading(true);
        setError(null);
        try {
            const dataWithUser = { ...hallazgoData, id_usuario_buscador: user.id };
            const response = await api.post('/hallazgos', dataWithUser);
            console.log("✅ Hallazgo creado con éxito:", response.data);
            fetchHallazgos();
            return true;
        } catch (err) {
            console.error("❌ Error al crear hallazgo:", err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Error al crear el hallazgo. Intente de nuevo.');
            setIsLoading(false);
            return false;
        }
    }, [fetchHallazgos, user]);

    const actualizarHallazgo = useCallback(async (id, updatedData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.put(`/hallazgos/${id}`, updatedData);
            fetchHallazgos();
            return response.data;
        } catch (err) {
            console.error(`❌ Error al actualizar hallazgo con ID ${id}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al actualizar el hallazgo.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchHallazgos]);

    const eliminarHallazgo = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.delete(`/hallazgos/${id}`);
            fetchHallazgos();
            return response.data;
        } catch (err) {
            console.error(`❌ Error al eliminar hallazgo con ID ${id}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al eliminar el hallazgo.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchHallazgos]);

    const searchHallazgos = useCallback(async (searchTerm) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/hallazgos/buscar?searchTerm=${encodeURIComponent(searchTerm)}&id_usuario_buscador=${user.id}`);
            setHallazgos(response.data.data);
        } catch (err) {
            console.error("❌ Error al buscar hallazgos:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al realizar la búsqueda.');
            setHallazgos([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    return {
        hallazgos,
        fetchHallazgos,
        getHallazgoById,
        createHallazgo,
        actualizarHallazgo,
        eliminarHallazgo,
        searchHallazgos,
        isLoading,
        error,
    };
};