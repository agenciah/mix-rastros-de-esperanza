// RUTA: frontend/hooks/admin/useAdminPagos.js

import { useState, useCallback } from 'react';
import apiAdmin from '@/lib/axiosAdmin';
import { toast } from 'sonner';

export const useAdminPagos = () => {
    // --- ESTADOS ---
    // Guardamos las dos listas que necesitamos, más los estados de carga y error.
    const [pagosPendientes, setPagosPendientes] = useState([]);
    const [pagosRecientes, setPagosRecientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FUNCIONES ---

    // 1. Función principal para cargar AMBAS listas de la API.
    // La envolvemos en useCallback para optimizar el rendimiento.
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Hacemos las dos llamadas a la API en paralelo para más eficiencia
            const [pendientesRes, recientesRes] = await Promise.all([
                apiAdmin.get('/pagos-pendientes'),
                // NOTA: Crearemos este endpoint en el siguiente paso.
                // Por ahora, devolvemos un array vacío si falla.
                apiAdmin.get('/pagos-recientes').catch(() => ({ data: { data: [] } }))
            ]);

            setPagosPendientes(pendientesRes.data.data || []);
            setPagosRecientes(recientesRes.data.data || []);

        } catch (err) {
            console.error("Error al cargar los datos de pagos:", err);
            setError("No se pudieron cargar los datos de pagos. Revisa la conexión con el servidor.");
            toast.error("Error al cargar los datos de pagos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. Función para marcar un pago como completado.
    const marcarComoPagado = useCallback(async (userId) => {
        const originalPendientes = [...pagosPendientes];
        // Actualización optimista: removemos al usuario de la lista de pendientes al instante.
        setPagosPendientes(prev => prev.filter(p => p.id !== userId));
        
        try {
            toast.info(`Validando pago para el usuario ID: ${userId}...`);
            // NOTA: Crearemos este endpoint en el siguiente paso.
            await apiAdmin.post('/marcar-pago', { userId });
            toast.success('Pago validado correctamente. Las listas se actualizarán.');
            
            // Recargamos los datos para asegurar consistencia
            await fetchData();

        } catch (err) {
            console.error("Error al marcar el pago:", err);
            toast.error('Error al marcar el pago. Revirtiendo cambios.');
            // Si la API falla, revertimos el cambio optimista.
            setPagosPendientes(originalPendientes);
        }
    }, [fetchData, pagosPendientes]);

    // 3. Función para revertir un pago (el "deshacer").
    const revertirPago = useCallback(async (pagoId) => {
        // Lógica similar a marcarComoPagado, pero para la acción inversa
        try {
            toast.info(`Revirtiendo pago ID: ${pagoId}...`);
            // NOTA: Crearemos este endpoint en el siguiente paso.
            await apiAdmin.post('/revertir-pago', { pagoId });
            toast.success('Pago revertido con éxito. Las listas se actualizarán.');
            
            await fetchData();

        } catch (err) {
            console.error("Error al revertir el pago:", err);
            toast.error('Error al revertir el pago.');
        }
    }, [fetchData]);

    // --- VALOR DE RETORNO ---
    // Exponemos los estados y las funciones para que el componente los pueda usar.
    return {
        pagosPendientes,
        pagosRecientes,
        isLoading,
        error,
        fetchData, // Exponemos fetchData por si queremos un botón de "refrescar"
        marcarComoPagado,
        revertirPago
    };
};