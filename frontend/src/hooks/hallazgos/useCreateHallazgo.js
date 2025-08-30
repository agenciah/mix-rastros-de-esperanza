// src/hooks/hallazgos/useCreateHallazgo.js
import { useState } from 'react';
import api from '@/lib/axios';

export default function useCreateHallazgo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const createHallazgo = async (hallazgoData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("📤 POST /api/hallazgos body:", hallazgoData); // 👀 Ver payload
      const response = await api.post('/api/hallazgos', hallazgoData);
      console.log("✅ Respuesta /api/hallazgos:", response.data);
      setSuccess(response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Error /api/hallazgos:", {
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Ocurrió un error al crear el hallazgo.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createHallazgo, loading, error, success };
}
