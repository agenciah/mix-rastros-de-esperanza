// RUTA: frontend/pages/admin/MensajesAdmin.jsx

import React, { useState, useEffect } from 'react';
import { useAdminMessages } from '@/hooks/admin/useAdminMessages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Loader2, Edit, Archive, ArchiveRestore } from 'lucide-react';

const MensajesAdmin = () => {
    // El hook nos da todo lo que necesitamos
    const { messages, isLoading, fetchMessages, postMessage, updateMessage, updateStatus } = useAdminMessages();

    // Estados para el formulario de creación
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados para el modal de edición
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentMessage, setCurrentMessage] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handlePostMessage = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await postMessage({ titulo: newTitle, contenido: newContent, tipo_mensaje: newType });
        if (success) {
            setNewTitle('');
            setNewContent('');
        }
        setIsSubmitting(false);
    };

    const handleOpenEditDialog = (message) => {
        setCurrentMessage(message);
        setEditTitle(message.titulo);
        setEditContent(message.contenido);
        setIsEditDialogOpen(true);
    };
    
    const handleUpdateMessage = async () => {
        if (!currentMessage) return;
        setIsSubmitting(true);
        const success = await updateMessage(currentMessage.id_mensaje, { titulo: editTitle, contenido: editContent });
        if (success) {
            setIsEditDialogOpen(false);
            setCurrentMessage(null);
        }
        setIsSubmitting(false);
    };

    const handleToggleArchive = (message) => {
        const newStatus = message.estado === 'activo' ? 'archivado' : 'activo';
        updateStatus(message.id_mensaje, newStatus);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Gestión de Mensajes para Usuarios</h1>

            {/* Formulario de Creación */}
            <Card>
                <CardHeader>
                    <CardTitle>Crear Nuevo Mensaje</CardTitle>
                    <CardDescription>Este mensaje aparecerá en el dashboard de todos los usuarios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePostMessage} className="space-y-4">
                        {/* ... (Contenido del formulario como antes) ... */}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Publicando..." : "Publicar Mensaje"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tabla de Mensajes Enviados */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Mensajes</CardTitle>
                    <CardDescription>Aquí puedes ver, editar y archivar todos los mensajes que has enviado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha de Creación</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg) => (
                                    <TableRow key={msg.id_mensaje}>
                                        <TableCell className="font-medium">{msg.titulo}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded-full ${msg.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {msg.estado}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(msg.fecha_creacion).toLocaleString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(msg)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleToggleArchive(msg)}>
                                                {msg.estado === 'activo' ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Edición */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Mensaje</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label htmlFor="edit-titulo">Título</label>
                            <Input id="edit-titulo" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="edit-contenido">Contenido</label>
                            <Textarea id="edit-contenido" value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={5} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateMessage} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MensajesAdmin;