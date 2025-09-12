// RUTA: frontend/pages/admin/GestionReportes.jsx

import React, { useEffect, useState } from 'react';
import { useAdminReports } from '@/hooks/admin/useAdminReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertCircle, Eye, MessageCircle, Gavel, ShieldAlert, UserX } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const GestionReportes = () => {
    const { reports, conversation, isLoading, error, fetchReports, fetchConversation, resolveReport, moderateUser } = useAdminReports();
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleViewConversation = (report) => {
        setSelectedReport(report);
        fetchConversation(report.conversation_id);
        setIsDialogOpen(true);
    };
    
    const handleResolve = (status) => {
        resolveReport(selectedReport.id_reporte, status);
        setIsDialogOpen(false);
    };

    const handleModerate = (userId, action) => {
        moderateUser(userId, action);
        toast.info(`Acción de moderación enviada.`);
    };

    if (isLoading && reports.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-8">{error}</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Gestión de Reportes</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Reportes Pendientes</CardTitle>
                    <CardDescription>Conversaciones reportadas por usuarios que requieren tu atención.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reportado Por</TableHead>
                                <TableHead>Usuario Reportado</TableHead>
                                <TableHead>Motivo</TableHead>
                                <TableHead>Fecha del Reporte</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? reports.map((report) => (
                                <TableRow key={report.id_reporte}>
                                    <TableCell>{report.reportador_nombre}</TableCell>
                                    <TableCell className="font-medium">{report.reportado_nombre}</TableCell>
                                    <TableCell className="max-w-xs truncate">{report.motivo}</TableCell>
                                    <TableCell>{new Date(report.fecha_creacion).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleViewConversation(report)}>
                                            <Eye className="mr-2 h-4 w-4" /> Revisar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No hay reportes pendientes.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Revisión de Conversación Reportada</DialogTitle>
                        <p className="text-sm text-gray-500">
                            <strong>Reportado por:</strong> {selectedReport?.reportador_nombre} <br />
                            <strong>Usuario reportado:</strong> {selectedReport?.reportado_nombre} <br />
                            <strong>Motivo:</strong> {selectedReport?.motivo}
                        </p>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-3 gap-6 mt-4">
                        {/* Columna de la conversación */}
                        <div className="col-span-2 border rounded-md p-4 h-96 overflow-y-auto space-y-4">
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
                                conversation.map(msg => (
                                    <div key={msg.id_mensaje} className={`flex ${msg.id_remitente === selectedReport.reportado_id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-lg max-w-sm ${msg.id_remitente === selectedReport.reportado_id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <p className="font-bold text-sm">{msg.sender_name}</p>
                                            <p>{msg.contenido}</p>
                                            <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.fecha_envio).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        {/* Columna de acciones */}
                        <div className="col-span-1 space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Panel de Moderación</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm font-medium">Acciones sobre el Reporte:</p>
                                    <Button className="w-full" variant="outline" onClick={() => handleResolve('resuelto')}>Marcar como Resuelto</Button>
                                    <Button className="w-full" variant="outline" onClick={() => handleResolve('desestimado')}>Desestimar Reporte</Button>
                                    
                                    <p className="text-sm font-medium pt-4">Acciones sobre el Usuario Reportado:</p>
                                    <Button className="w-full flex justify-start gap-2" variant="secondary" onClick={() => handleModerate(selectedReport.reportado_id, 'advertido')}>
                                        <ShieldAlert className="h-4 w-4 text-yellow-600"/> Enviar Advertencia
                                    </Button>
                                    <Button className="w-full flex justify-start gap-2" variant="destructive" onClick={() => handleModerate(selectedReport.reportado_id, 'suspendido')}>
                                        <UserX className="h-4 w-4"/> Suspender Usuario
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GestionReportes;