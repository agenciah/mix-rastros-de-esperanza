// RUTA: src/pages/dashboard/Mensajes.jsx
import React, { useState, useEffect } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useReports } from '@/hooks/useReports';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Send, AlertTriangle } from 'lucide-react'; // <-- Se añade AlertTriangle
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Mensajes = () => {
    const { conversationId } = useParams(); 
    const { 
        conversations, messages, isLoading, error, 
        fetchConversations, fetchMessages, sendMessage, markMessagesAsRead
    } = useMessaging();

    // --- LÓGICA DE REPORTES (Se añade) ---
    const { isReporting, submitReport } = useReports();
    const [reportReason, setReportReason] = useState('');
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    // ------------------------------------

    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.conversation_id);
            markMessagesAsRead(selectedConversation.conversation_id);
        }
    }, [selectedConversation, fetchMessages, markMessagesAsRead]);

    // 3. AÑADE ESTE useEffect
    useEffect(() => {
        // Si hay conversaciones cargadas y un ID en la URL,
        // busca y selecciona esa conversación automáticamente.
        if (conversationId && conversations.length > 0) {
            const initialConversation = conversations.find(
                c => c.conversation_id.toString() === conversationId
            );
            if (initialConversation) {
                setSelectedConversation(initialConversation);
            }
        }
    }, [conversationId, conversations]); // Se ejecuta cuando el ID o las conversaciones cambian


    // --- FUNCIÓN PARA ENVIAR REPORTE (Se añade) ---
    const handleSendReport = async () => {
        if (!selectedConversation) return;
        const success = await submitReport(
            selectedConversation.conversation_id,
            selectedConversation.other_user_id,
            reportReason
        );
        if (success) {
            setReportReason('');
            setIsReportDialogOpen(false);
        }
    };
    // -------------------------------------------

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;
        try {
            await sendMessage(selectedConversation.other_user_id, newMessage);
            setNewMessage('');
            await fetchMessages(selectedConversation.conversation_id);
            await fetchConversations();
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return format(new Date(dateString), "MMM d, HH:mm", { locale: es });
    };

    if (isLoading && conversations.length === 0) {
        return <div className="text-center mt-10"><Loader2 className="animate-spin inline-block mr-2" /> Cargando...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">{error}</div>;
    }

    return (
        <div className="flex h-[calc(100vh-100px)] border rounded-lg overflow-hidden">
            {/* Panel de Conversaciones */}
            <div className="w-1/3 border-r bg-gray-50 overflow-y-auto p-2">
                <h2 className="text-xl font-bold p-2 sticky top-0 bg-gray-50 z-10">Conversaciones</h2>
                {conversations.length === 0 ? (
                    <p className="text-center text-gray-500 mt-4">No hay conversaciones aún.</p>
                ) : (
                    conversations.map(conv => (
                        <div 
                            key={conv.conversation_id} 
                            onClick={() => handleSelectConversation(conv)} // <-- Mandamos el objeto completo
                            className={`p-4 border-b cursor-pointer hover:bg-gray-200 transition ${selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gray-200' : ''}`}
                        >
                            <div className="font-semibold">{conv.other_user_name}</div>
                            <div className="text-sm text-gray-600 truncate">{conv.last_message || "Sin mensajes"}</div>
                            <div className="text-xs text-gray-400 mt-1">{conv.last_message_at ? formatDate(conv.last_message_at) : ''}</div>
                            {conv.unread_count > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 mt-1 float-right">{conv.unread_count}</span>
                            )}
                        </div>
                    ))
                )}
            </div>

            

            {/* Panel de Mensajes */}
            <div className="w-2/3 flex flex-col p-4">
                {!selectedConversation ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Selecciona una conversación para empezar.
                    </div>
                ) : (
                    <>
                        {/* --- INICIO: Cabecera del Chat con Botón de Reportar (NUEVA) --- */}
                        <div className="p-4 border-b flex justify-between items-center bg-white">
                            <h3 className="text-lg font-semibold">{selectedConversation.other_user_name}</h3>
                            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                                        <AlertTriangle className="mr-2 h-4 w-4" /> Reportar
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reportar Conversación</DialogTitle>
                                        <DialogDescription>
                                            Describe por qué crees que esta conversación viola las normas de la comunidad.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        placeholder="Ej: El usuario está siendo ofensivo, es spam, etc."
                                        rows={4}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
                                        <Button variant="destructive" onClick={handleSendReport} disabled={isReporting}>
                                            {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Enviar Reporte
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {/* --- FIN: Cabecera del Chat --- */}
                        <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-lg mb-4 bg-gray-50">
                            {isLoading ? (
                                <div className="text-center"><Loader2 className="animate-spin inline-block mr-2" /> Cargando mensajes...</div>
                            ) : (
                                messages.map(msg => (
                                    <div 
                                        key={msg.id_mensaje} 
                                        className={`flex ${msg.id_remitente === selectedConversation.other_user_id ? 'justify-start' : 'justify-end'}`} // <-- Corregimos la lógica
                                    >
                                        <Card className={`max-w-xs ${msg.id_remitente !== selectedConversation.other_user_id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                                            <CardContent className="p-4">
                                                <div className="font-bold">{msg.sender_name}</div>
                                                <p className="text-sm mt-1">{msg.contenido}</p>
                                                <div className="text-xs opacity-80 mt-1 text-right">
                                                    {formatDate(msg.fecha_envio)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Formulario de envío de mensaje */}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                                <Send size={18} />
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Mensajes;