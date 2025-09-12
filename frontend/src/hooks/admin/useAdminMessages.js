// RUTA: frontend/hooks/admin/useAdminMessages.js

import { useState, useCallback } from 'react';
import apiAdmin from '@/lib/axiosAdmin';
import { toast } from 'sonner';

export const useAdminMessages = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiAdmin.get('/mensajes');
            setMessages(response.data.data || []);
        } catch (err) {
            console.error("Error al cargar los mensajes:", err);
            toast.error("No se pudieron cargar los mensajes.");
            setError("Error al cargar los mensajes.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const postMessage = useCallback(async (messageData) => {
        try {
            await apiAdmin.post('/mensajes', messageData);
            toast.success("Mensaje publicado con éxito.");
            await fetchMessages(); // Recargar la lista
            return true;
        } catch (err) {
            console.error("Error al publicar el mensaje:", err);
            toast.error(err.response?.data?.message || "Error al publicar el mensaje.");
            return false;
        }
    }, [fetchMessages]);
    
    const updateMessage = useCallback(async (messageId, messageData) => {
        try {
            await apiAdmin.put(`/mensajes/${messageId}`, messageData);
            toast.success("Mensaje actualizado con éxito.");
            await fetchMessages(); // Recargar la lista
            return true;
        } catch (err) {
            console.error("Error al actualizar el mensaje:", err);
            toast.error(err.response?.data?.message || "Error al actualizar el mensaje.");
            return false;
        }
    }, [fetchMessages]);

    const updateStatus = useCallback(async (messageId, newStatus) => {
        try {
            await apiAdmin.put(`/mensajes/${messageId}/estado`, { estado: newStatus });
            toast.success(`Mensaje marcado como ${newStatus}.`);
            await fetchMessages(); // Recargar la lista
        } catch (err) {
            console.error("Error al cambiar estado del mensaje:", err);
            toast.error("Error al cambiar el estado del mensaje.");
        }
    }, [fetchMessages]);

    return {
        messages,
        isLoading,
        error,
        fetchMessages,
        postMessage,
        updateMessage,
        updateStatus,
    };
};