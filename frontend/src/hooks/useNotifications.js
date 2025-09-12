// RUTA: frontend/hooks/useNotifications.js

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/notifications');
            const data = response.data.data || [];
            setNotifications(data);
            // Calculamos cuántas no están leídas
            setUnreadCount(data.filter(n => n.estado === 'no_leido').length);
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
            toast.error("No se pudieron cargar las notificaciones.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        // Actualización optimista para una mejor UX
        setNotifications(prev => prev.map(n => ({ ...n, estado: 'leido' })));
        setUnreadCount(0);

        try {
            await api.put('/api/notifications/read');
        } catch (error) {
            console.error("Error al marcar notificaciones como leídas:", error);
            toast.error("Error al actualizar las notificaciones.");
            // Si falla, podríamos revertir el cambio, pero por ahora lo dejamos así.
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return { notifications, unreadCount, isLoading, markAllAsRead, fetchNotifications };
};