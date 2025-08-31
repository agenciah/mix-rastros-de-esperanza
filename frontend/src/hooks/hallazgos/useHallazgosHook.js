import { useState, useCallback, useEffect } from 'react';
import api from '../../lib/axios';

/**
 * @fileoverview Hook para manejar todas las interacciones con la API de Hallazgos.
 * Centraliza las funciones del CRUD y la búsqueda, proporcionando un estado de carga y error.
 */
export const useHallazgos = () => {
    const [hallazgos, setHallazgos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Obtiene todos los hallazgos.
     * @returns {Promise<Array>} Un array de objetos de hallazgo.
     */
    const fetchHallazgos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/hallazgos');
            setHallazgos(response.data.data); // CORRECCIÓN: Almacena los datos en el estado
        } catch (err) {
            console.error("❌ Error al obtener todos los hallazgos:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al cargar los hallazgos.');
            setHallazgos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carga inicial de los datos
    useEffect(() => {
        fetchHallazgos();
    }, [fetchHallazgos]);

    /**
     * Obtiene un hallazgo por su ID.
     * @param {string} id El ID del hallazgo.
     * @returns {Promise<Object|null>} Un objeto de hallazgo o null si falla.
     */
    const getHallazgoById = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/hallazgos/${id}`);
            return response.data.data;
        } catch (err) {
            console.error(`❌ Error al obtener hallazgo con ID ${id}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al obtener el hallazgo.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Crea un nuevo hallazgo.
     * @param {Object} hallazgoData Los datos del hallazgo a crear.
     * @returns {Promise<Object|null>} El hallazgo creado o null si falla.
     */
    const createHallazgo = useCallback(async (hallazgoData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/hallazgos', hallazgoData);
            console.log("✅ Hallazgo creado con éxito:", response.data);
            fetchHallazgos(); // CORRECCIÓN: Refresca la lista después de crear
            return true;
        } catch (err) {
            console.error("❌ Error al crear hallazgo:", err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Error al crear el hallazgo. Intente de nuevo.');
            setIsLoading(false);
            return false;
        }
    }, [fetchHallazgos]);

    /**
     * Actualiza un hallazgo existente.
     * @param {string} id El ID del hallazgo a actualizar.
     * @param {Object} updatedData Los datos actualizados del hallazgo.
     * @returns {Promise<Object|null>} El resultado de la actualización o null si falla.
     */
    const actualizarHallazgo = useCallback(async (id, updatedData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.put(`/api/hallazgos/${id}`, updatedData);
            fetchHallazgos(); // CORRECCIÓN: Refresca la lista después de actualizar
            return response.data;
        } catch (err) {
            console.error(`❌ Error al actualizar hallazgo con ID ${id}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al actualizar el hallazgo.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchHallazgos]);

    /**
     * Elimina un hallazgo por su ID.
     * @param {string} id El ID del hallazgo a eliminar.
     * @returns {Promise<Object|null>} El resultado de la eliminación o null si falla.
     */
    const eliminarHallazgo = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.delete(`/api/hallazgos/${id}`);
            fetchHallazgos(); // CORRECCIÓN: Refresca la lista después de eliminar
            return response.data;
        } catch (err) {
            console.error(`❌ Error al eliminar hallazgo con ID ${id}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al eliminar el hallazgo.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchHallazgos]);

    /**
     * Busca hallazgos por un término de búsqueda.
     * @param {string} searchTerm El término de búsqueda.
     * @returns {Promise<Array>} Un array de objetos de hallazgo.
     */
    const searchHallazgos = useCallback(async (searchTerm) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/hallazgos/buscar?searchTerm=${encodeURIComponent(searchTerm)}`);
            setHallazgos(response.data.data); // CORRECCIÓN: Almacena los resultados de la búsqueda
        } catch (err) {
            console.error("❌ Error al buscar hallazgos:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al realizar la búsqueda.');
            setHallazgos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        hallazgos, // Ahora devolvemos el estado 'hallazgos'
        fetchHallazgos,
        getHallazgoById,
        createHallazgo,
        actualizarHallazgo,
        eliminarHallazgo, // Se cambió el nombre de la función para mayor claridad
        searchHallazgos,
        isLoading,
        error,
    };
};