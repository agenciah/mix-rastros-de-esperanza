// src/hooks/useMatchDetail.js

import { useState, useEffect } from 'react';
import apiAdmin from '../lib/axiosAdmin';

const useMatchDetail = (matchId) => {
  const [matchDetail, setMatchDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 🚨 CAMBIO AQUÍ: elimina el '/admin' duplicado
        const response = await apiAdmin.get(`/matches/${matchId}`);
        setMatchDetail(response.data);
      } catch (err) {
        console.error('Error al obtener los detalles de la coincidencia:', err);
        setError('No se pudieron cargar los detalles de la coincidencia.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [matchId]);

  

  return { matchDetail, isLoading, error };
};

export default useMatchDetail;