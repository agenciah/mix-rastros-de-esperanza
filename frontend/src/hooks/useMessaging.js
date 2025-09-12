// src/hooks/useMessaging.js

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import {useNavigate} from 'react-router-dom';

export const useMessaging = () => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    // Función para obtener la lista de conversaciones
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/messaging/conversations');
            setConversations(response.data);
        } catch (err) {
            setError('Error al cargar las conversaciones.');
            console.error('Error fetching conversations:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Función para obtener los mensajes de una conversación específica
    const fetchMessages = useCallback(async (conversationId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/messaging/conversations/${conversationId}/messages`);
            setMessages(response.data);
        } catch (err) {
            setError('Error al cargar los mensajes.');
            console.error('Error fetching messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Función para enviar un nuevo mensaje
    const sendMessage = useCallback(async (receiverId, content) => {
        setError(null);
        try {
            const response = await api.post('/api/messaging/messages', { receiverId, content });
            return response.data;
        } catch (err) {
            setError('Error al enviar el mensaje.');
            console.error('Error sending message:', err);
            throw err;
        }
    }, []);
    
    // Función para marcar mensajes como leídos
    const markMessagesAsRead = useCallback(async (conversationId) => {
        try {
            // Este endpoint aún no existe, pero es buena práctica tener el frontend preparado
            await api.put(`/api/messaging/conversations/${conversationId}/read`);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    }, []);

   // Función para iniciar una nueva conversación
    const startConversation = useCallback(async (otherUserId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/messaging/conversations', { otherUserId });
            const conversationId = response.data.conversationId;

            // Navega directamente a la conversación
            navigate(`/dashboard/mensajes/${conversationId}`);
            
            return conversationId; // Podrías devolver el ID, aunque ya no es necesario para el HallazgoDetail
        } catch (err) {
            setError('Error al iniciar la conversación.');
            console.error('Error starting a new conversation:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]); // Agregamos 'navigate' a las dependencias de useCallback

    return {
        conversations,
        messages,
        isLoading,
        error,
        fetchConversations,
        fetchMessages,
        sendMessage,
        markMessagesAsRead,
        startConversation // Exporta la nueva función
    };
};