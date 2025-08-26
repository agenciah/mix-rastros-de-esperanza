import { useState } from "react";
import axios from "axios";

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
      const res = await axios.post("/api/fichas/", data);
      if (res.data.success) {
        setSuccess(true);
        setFichaId(res.data.id_ficha);
        if (res.data.matches) setMatches(res.data.matches);
      } else {
        setError(res.data.message || "Error al crear ficha");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  return { createFicha, loading, error, success, fichaId, matches };
}
