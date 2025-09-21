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

                
                setData({
                    ...data, // Mantén el estado actual si lo necesitas
                    globalStats: response.data.stats.globalStats,
                    casosEncontrados: response.data.stats.casosEncontrados,
                    actividadReciente: response.data.stats.actividadReciente, // ✅ Asegúrate de que este dato se guarde correctamente
                    mensajesAdministrador: response.data.messages,
                    fichasRecientes: response.data.fichasRecientes || [] // Nuevas fichas recientes
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
