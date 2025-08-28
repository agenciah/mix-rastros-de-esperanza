// src/hooks/useCreateFicha.js
import { useState } from "react";
import api from "../lib/axios";

export default function useCreateFicha() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fichaId, setFichaId] = useState(null);
  const [matches, setMatches] = useState([]);

  const createFicha = async (data) => { 
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFichaId(null);
    setMatches([]);

    try {
      const res = await api.post("/api/fichas", data);
      
      // Actualiza el estado del hook
      setSuccess(res.data.success);
      setFichaId(res.data.id_ficha);
      if (res.data.matches) setMatches(res.data.matches);

      // ¡Importante! Devuelve la respuesta para que el otro hook pueda usarla
      return {
        success: res.data.success,
        message: res.data.message,
        id_ficha: res.data.id_ficha,
        matches: res.data.matches
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error de red";
      setError(errorMessage);
      
      // Devuelve el error para que el otro hook lo maneje
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createFicha, loading, error, success, fichaId, matches };
}
