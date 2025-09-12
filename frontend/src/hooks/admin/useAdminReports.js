// RUTA: frontend/hooks/admin/useAdminReports.js

import { useState, useCallback } from 'react';
import apiAdmin from '@/lib/axiosAdmin';
import { toast } from 'sonner';

export const useAdminReports = () => {
    const [reports, setReports] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carga la lista inicial de reportes pendientes
    // Carga la lista inicial de reportes pendientes
    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ CORRECCIÓN AQUÍ: Cambia 'reports' a 'reportes'
            const response = await apiAdmin.get('/reportes');
            setReports(response.data.data || []);
        } catch (err) {
            toast.error("No se pudieron cargar los reportes.");
            setError("Error al cargar los reportes.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carga el contenido de una conversación específica
    const fetchConversation = useCallback(async (conversationId) => {
        setIsLoading(true);
        setConversation([]);
        try {
            const response = await apiAdmin.get(`/conversations/${conversationId}`);
            setConversation(response.data.data || []);
        } catch (err) {
            toast.error("No se pudo cargar la conversación.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resolveReport = useCallback(async (reportId, newStatus) => {
        try {
            // ✅ CORRECCIÓN AQUÍ: También ajustamos esta ruta para consistencia
            await apiAdmin.put(`/reportes/${reportId}/resolve`, { newStatus });
            toast.success(`Reporte marcado como ${newStatus}.`);
            await fetchReports();
        } catch (err) {
            toast.error("Error al actualizar el reporte.");
        }
    }, [fetchReports]);

    // Modera a un usuario
    const moderateUser = useCallback(async (userId, action) => {
        try {
            // ✅ CORRECCIÓN AQUÍ: También ajustamos esta ruta
            await apiAdmin.put(`/usuarios/${userId}/moderate`, { action });
            toast.success(`Acción '${action}' aplicada al usuario.`);
        } catch (err) {
            toast.error("Error al aplicar la acción al usuario.");
        }
    }, []);

    return {
        reports,
        conversation,
        isLoading,
        error,
        fetchReports,
        fetchConversation,
        resolveReport,
        moderateUser,
    };
};