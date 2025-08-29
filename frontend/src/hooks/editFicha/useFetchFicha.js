// src/hooks/useFetchFicha.js

import { useState, useEffect } from "react";
import api from "../../lib/axios";
import { ChartNoAxesColumnDecreasing } from "lucide-react";


/**
 * Custom hook para obtener los datos de una ficha por su ID.
 * @param {string} id - El ID de la ficha a buscar.
 * @returns {object} Un objeto con la ficha cargada, el estado de carga y cualquier error.
 */
export default function useFetchFicha(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay un ID, no hacemos la llamada
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchFicha = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await api.get(`/api/fichas/${id}`);
        // Log de éxito para saber que la llamada funcionó
        console.log('Datos de la ficha obtenidos con éxito:', res.data);
        setData(res.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "Error al cargar la ficha.";
        // Log de error para identificar problemas
        console.error('Error al obtener la ficha:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFicha();
  }, [id]); // El efecto se ejecuta de nuevo si el ID cambia

  return { data, loading, error };
}
