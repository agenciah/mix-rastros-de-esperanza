// RUTA: frontend/pages/admin/GestionPagos.jsx

import React, { useEffect } from 'react';
import { useAdminPagos } from '@/hooks/admin/useAdminPagos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

const GestionPagos = () => {
    // 1. Usamos nuestro hook personalizado para obtener toda la lógica y los datos.
    const {
        pagosPendientes,
        pagosRecientes,
        isLoading,
        error,
        fetchData,
        marcarComoPagado,
        revertirPago
    } = useAdminPagos();

    // 2. useEffect para cargar los datos cuando el componente se monta por primera vez.
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 3. Función manejadora para el checkbox de validación.
    const handleMarcarPago = (userId, montoACobrar) => {
        if (!userId) return;
        // Pasamos tanto el ID del usuario como el monto para registrarlo en el historial.
        marcarComoPagado(userId, montoACobrar);
    };

    // 4. Función manejadora para el botón de "Deshacer".
    const handleRevertirPago = (pagoId) => {
        if (!pagoId) return;
        revertirPago(pagoId);
    };

    // --- RENDERIZADO DEL COMPONENTE ---

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Cargando datos de pagos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Card className="border-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-600">
                            <AlertCircle className="mr-2" /> Error de Conexión
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                        <Button onClick={fetchData} className="mt-4">Reintentar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-bold">Gestión de Donaciones y Pagos</h1>

            {/* --- Tabla de Pagos Pendientes --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Pagos Pendientes</CardTitle>
                    <CardDescription>
                        Usuarios cuyo periodo de servicio ha vencido y requieren validación manual de su donación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Validado</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Nº Referencia</TableHead>
                                <TableHead>Fichas Activas</TableHead>
                                <TableHead>Monto Sugerido</TableHead>
                                <TableHead>Fecha de Vencimiento</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pagosPendientes.length > 0 ? (
                                pagosPendientes.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Checkbox
                                                onCheckedChange={() => handleMarcarPago(user.id, user.montoACobrar)}
                                            />
                                        </TableCell>
                                        <TableCell>{user.nombre}</TableCell>
                                        <TableCell>{user.telefono}</TableCell>
                                        <TableCell className="font-mono">{user.numero_referencia_unico}</TableCell>
                                        <TableCell>{user.fichasActivas}</TableCell>
                                        <TableCell className="font-semibold">${user.montoACobrar.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(user.fecha_fin).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        ¡Excelente! No hay pagos pendientes por validar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* --- Tabla de Pagos Validados Recientemente --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Pagos Validados (Últimas 24h)</CardTitle>
                    <CardDescription>
                        Lista de los pagos que has validado recientemente. Puedes revertir la acción si cometiste un error.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Monto Validado</TableHead>
                                <TableHead>Fecha de Validación</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pagosRecientes.length > 0 ? (
                                pagosRecientes.map((pago) => (
                                    <TableRow key={pago.id_pago}>
                                        <TableCell>{pago.nombre}</TableCell>
                                        <TableCell>${pago.monto.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(pago.fecha_pago).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRevertirPago(pago.id_pago)}
                                            >
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Deshacer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        No se han validado pagos recientemente.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default GestionPagos;