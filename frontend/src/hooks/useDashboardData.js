// frontend/hooks/useDashboardData.js

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export const useDashboardData = () => {
    const [data, setData] = useState({
        globalStats: { totalFichas: 0, totalHallazgos: 0, casosResueltos: 0 },
        casosEncontrados: [],
        actividadReciente: [], // ✅ Ahora esta lista tendrá hallazgos
        mensajesAdministrador: [],
        fichasRecientes: [] // Nuevas fichas recientes
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/feed/dashboard');

                const responseData = response.data.data;
                setData({
                    // ✅ Corregido: Leemos del objeto 'stats' que está dentro de los datos
                    globalStats: responseData.stats.globalStats,
                    casosEncontrados: responseData.stats.casosEncontrados,
                    actividadReciente: responseData.stats.actividadReciente,
                    
                    // ✅ Corregido: Usamos 'adminMessages' en lugar de 'messages'
                    mensajesAdministrador: responseData.adminMessages,

                    // ✅ Corregido: Leemos de la raíz de los datos
                    fichasRecientes: responseData.fichasRecientes || []
                });
            } catch (err) {
                console.error("Error al cargar los datos del dashboard:", err);
                setError('No se pudieron cargar los datos del panel de control. Por favor, intente de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};
