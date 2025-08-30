// src/hooks/hallazgos/useEditHallazgo.js

import { useState } from 'react';
import api from '@/lib/axios';

export default function useEditHallazgo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const editHallazgo = async (id, hallazgoData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.put(`/api/hallazgos/${id}`, hallazgoData);
      setSuccess(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ocurrió un error al actualizar el hallazgo.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { editHallazgo, loading, error, success };
}