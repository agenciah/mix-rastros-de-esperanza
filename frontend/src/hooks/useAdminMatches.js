// src/hooks/useAdminMatches.js
import { useState, useEffect, useCallback } from 'react';
import apiAdmin from '../lib/axiosAdmin';

const useAdminMatches = (page = 1, limit = 10, status = 'all') => {
  const [matches, setMatches] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 🚨 CAMBIO AQUÍ: elimina el '/admin' duplicado
      const response = await apiAdmin.get('/matches', {
        params: { page, limit, status },
      });
      setMatches(response.data.matches);
      setTotalItems(response.data.totalItems);
    } catch (err) {
      console.error('Error al obtener coincidencias:', err);
      setError('No se pudieron cargar las coincidencias. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const updateMatchStatus = async (id, newStatus, comments) => {
    try {
      await apiAdmin.put(`/admin/matches/${id}/review`, {
        estado: newStatus,
        comentarios: comments,
      });
      // Vuelve a cargar los datos para reflejar el cambio
      fetchMatches();
    } catch (err) {
      console.error('Error al actualizar el estado de la coincidencia:', err);
      setError('No se pudo actualizar el estado. Por favor, intenta de nuevo.');
    }
  };

  return {
    matches,
    totalItems,
    isLoading,
    error,
    updateMatchStatus,
    fetchMatches,
  };
};

export default useAdminMatches;