// RUTA: frontend/hooks/useReports.js

import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export const useReports = () => {
    const [isReporting, setIsReporting] = useState(false);

    const submitReport = async (conversationId, reportedUserId, reason) => {
        if (!reason.trim()) {
            toast.error("Por favor, describe el motivo de tu reporte.");
            return false;
        }

        setIsReporting(true);
        try {
            await api.post('/api/messaging/report', {
                conversationId,
                reportedUserId,
                reason
            });
            toast.success("Reporte enviado con éxito. Un administrador lo revisará pronto.");
            return true;
        } catch (error) {
            console.error("Error al enviar el reporte:", error);
            toast.error("No se pudo enviar el reporte. Inténtalo de nuevo.");
            return false;
        } finally {
            setIsReporting(false);
        }
    };

    return { isReporting, submitReport };
};