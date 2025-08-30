// src/hooks/useFetchHallazgo.js

import { useState, useEffect } from "react";
import api from "@/lib/axios";

export const useFetchHallazgo = (id) => {
  const [hallazgo, setHallazgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchHallazgo = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/api/hallazgos/${id}`);
        console.log("Datos del hallazgo obtenidos:", res.data);
        if (res.data && res.data.success) {
          setHallazgo(res.data.data);
        } else {
          setError(res.data?.message || "Hallazgo no encontrado.");
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "Error al obtener el hallazgo.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHallazgo();
  }, [id]);

  return { hallazgo, loading, error };
};