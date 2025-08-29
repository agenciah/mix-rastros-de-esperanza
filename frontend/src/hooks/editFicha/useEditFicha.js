// src/hooks/useEditFicha.js

import { useState } from "react";
import api from "../../lib/axios";

/**
 * Custom hook para manejar la edición de una ficha de desaparición.
 * @returns {object} Un objeto con la función `editFicha` y el estado del proceso.
 */
export default function useEditFicha() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [matches, setMatches] = useState([]);

  /**
   * Envía los datos de la ficha al backend para su edición.
   * @param {number} id - El ID de la ficha a editar.
   * @param {object} data - Los datos de la ficha a actualizar.
   * @returns {Promise<object>} Un objeto con el resultado de la operación.
   */
  const editFicha = async (id, data) => { 
    setLoading(true);
    setError(null);
    setSuccess(false);
    setMatches([]);

    try {
      // Usamos el método PUT y enviamos el ID de la ficha en la URL
      const res = await api.put(`/api/fichas/${id}`, data);
      
      console.log('Ficha editada con éxito:', res.data); // Log de éxito
      
      // Actualiza el estado del hook
      setSuccess(res.data.success);
      if (res.data.matches) setMatches(res.data.matches);

      // Devuelve la respuesta para que el componente pueda manejarla
      return {
        success: res.data.success,
        message: res.data.message,
        matches: res.data.matches
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error de red";
      console.error('Error al editar la ficha:', errorMessage); // Log de error
      setError(errorMessage);
      
      // Devuelve el error para que el componente pueda manejarlo
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { editFicha, loading, error, success, matches };
}
