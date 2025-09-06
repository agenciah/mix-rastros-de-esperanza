// RUTA: frontend/hooks/useFichasRecientes.js

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export const useFichasRecientes = () => {
    const [fichasRecientes, setFichasRecientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFichas = async () => {
            try {
                // Usamos el endpoint público con un límite fijo para el dashboard
                const response = await api.get('/api/fichas/publicas?limit=5&offset=0');
                setFichasRecientes(response.data.data || []);
            } catch (err) {
                console.error("Error al cargar las fichas recientes:", err);
                setError("No se pudieron cargar las fichas recientes.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchFichas();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

    return { fichasRecientes, loading, error };
};