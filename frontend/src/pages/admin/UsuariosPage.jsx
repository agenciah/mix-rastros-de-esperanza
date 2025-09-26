/* eslint-disable no-irregular-whitespace */
// 📁 src/pages/admin/UsuariosPage.jsx
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import apiAdmin from '@/lib/axiosAdmin';
import DatosPersonales from './usuarios/Datospersonales';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Importamos Badge para el estado

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [search, setSearch] = useState('');
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ 1. AÑADIMOS UN ESTADO PARA EL FILTRO
    const [statusFilter, setStatusFilter] = useState('activo'); // Por defecto mostramos los activos

    // ✅ 2. MODIFICAMOS useEffect PARA QUE REACCIONE AL FILTRO
    useEffect(() => {
        async function fetchUsuarios() {
            setLoading(true);
            setUsuarioSeleccionado(null); // Limpiamos la selección al cambiar de filtro
            try {
                // Pasamos el filtro como un query param a la API
                const { data } = await apiAdmin.get(`/usuarios?status=${statusFilter}`);
                setUsuarios(data);
            } catch (e) {
                setError('Error al cargar la lista de usuarios');
                toast.error('Error al cargar la lista de usuarios');
            } finally {
                setLoading(false);
            }
        }
        fetchUsuarios();
    }, [statusFilter]); // Se ejecutará cada vez que 'statusFilter' cambie

    function seleccionarUsuario(usuarioId) {
        const usuario = usuarios.find(u => u.id === usuarioId);
        setUsuarioSeleccionado(usuario);
    }

    const usuariosFiltrados = usuarios.filter((user) =>
        user.nombre.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.telefono && user.telefono.includes(search))
    );

    function actualizarUsuarioCampo(campo, valor) {
        setUsuarioSeleccionado((prev) => ({ ...prev, [campo]: valor }));
    }

    async function guardarCambios() {
        if (!usuarioSeleccionado) return;

        // ✅ 3. CORREGIMOS EL OBJETO PARA ENVIAR 'estado_cuenta'
        const {
            id, nombre, email, telefono, estado_republica,
            role, estado_suscripcion, estado_cuenta,
        } = usuarioSeleccionado;

        try {
            await apiAdmin.put(`/usuarios/${id}`, {
                nombre, email, telefono, estado_republica,
                role, estado_suscripcion, estado_cuenta, // Enviamos el campo correcto
            });
            toast.success('Usuario actualizado correctamente');
            // Opcional: Refrescar la lista para ver los cambios inmediatamente
            setStatusFilter(prev => prev); // Truco para re-disparar el useEffect
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            toast.error('Error al actualizar usuario');
        }
    }

    // ✅ --- INICIO: LÓGICA PARA NUEVAS ACCIONES DE ADMIN ---
    
    const handleConfirmarEmail = async () => {
        if (!usuarioSeleccionado) return;
        try {
            await apiAdmin.put(`/usuarios/${usuarioSeleccionado.id}/confirmar`);
            toast.success('Correo del usuario confirmado manualmente.');
            // Aquí no es necesario refrescar la lista, el estado no es visible en la tabla
        } catch (error) {
            toast.error('Error al confirmar el correo.');
        }
    };

    const handleEnviarReseteo = async () => {
        if (!usuarioSeleccionado) return;
        try {
            await apiAdmin.post(`/usuarios/${usuarioSeleccionado.id}/enviar-reseteo`);
            toast.success(`Enlace de recuperación enviado a ${usuarioSeleccionado.email}.`);
        } catch (error) {
            toast.error('Error al enviar el enlace de recuperación.');
        }
    };

    const handleSoftDelete = async () => {
        if (!usuarioSeleccionado) return;
        
        // Pedimos confirmación para una acción destructiva
        if (window.confirm(`¿Estás seguro de que quieres desactivar la cuenta de ${usuarioSeleccionado.nombre}? El usuario no podrá iniciar sesión.`)) {
            try {
                await apiAdmin.delete(`/usuarios/${usuarioSeleccionado.id}/soft-delete`);
                toast.success('Usuario desactivado correctamente.');
                setUsuarioSeleccionado(null); // Ocultamos el panel de edición
                fetchUsuarios(); // Refrescamos la lista
            } catch (error) {
                toast.error('Error al desactivar el usuario.');
            }
        }
    };

    return (
        <div className="p-6">
            <Toaster position="top-right" richColors />
            <h1 className="text-3xl font-bold mb-6">Administrar Usuarios</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Buscar y Filtrar</CardTitle>
                    <CardDescription>
                        Busca por nombre, email o teléfono y filtra por estado de la cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-grow"
                    />
                    {/* ✅ 4. AÑADIMOS LOS BOTONES DE FILTRO */}
                    <div className="flex items-center gap-2">
                        <Button variant={statusFilter === 'activo' ? 'default' : 'outline'} onClick={() => setStatusFilter('activo')}>Activos</Button>
                        <Button variant={statusFilter === 'inactivo' ? 'default' : 'outline'} onClick={() => setStatusFilter('inactivo')}>Inactivos</Button>
                        <Button variant={statusFilter === 'todos' ? 'default' : 'outline'} onClick={() => setStatusFilter('todos')}>Todos</Button>
                    </div>
                </CardContent>
            </Card>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Lista de Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {usuariosFiltrados.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Estado</TableHead> {/* ✅ 5. NUEVA COLUMNA DE ESTADO */}
                                        <TableHead>Rol</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usuariosFiltrados.map(user => (
                                        <TableRow key={user.id} onClick={() => seleccionarUsuario(user.id)} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>{user.nombre}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.telefono}</TableCell>
                                            {/* ✅ 5. MOSTRAMOS EL ESTADO CON UN BADGE */}
                                            <TableCell>
                                                <Badge variant={user.estado_cuenta === 'activo' ? 'default' : 'destructive'}>
                                                    {user.estado_cuenta}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.role}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No se encontraron usuarios para el filtro seleccionado.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {usuarioSeleccionado && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Editar Usuario: {usuarioSeleccionado.nombre}</CardTitle>
                        <CardDescription>
                            Modifica la información o realiza acciones administrativas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DatosPersonales usuario={usuarioSeleccionado} onChange={actualizarUsuarioCampo} />
                        <Button onClick={guardarCambios} className="w-full mt-4">Guardar cambios</Button>
                        
                        {/* ✅ --- INICIO: NUEVOS BOTONES DE ACCIÓN --- */}
                        <Separator className="my-6" />
                        <div className="space-y-4">
                            <h3 className="text-md font-semibold text-gray-700">Acciones Rápidas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Button variant="outline" onClick={handleConfirmarEmail}>
                                    Confirmar Email
                                </Button>
                                <Button variant="outline" onClick={handleEnviarReseteo}>
                                    Enviar Recuperación
                                </Button>
                                <Button variant="destructive" onClick={handleSoftDelete}>
                                    Desactivar Cuenta
                                </Button>
                            </div>
                        </div>
                        {/* ✅ --- FIN: NUEVOS BOTONES DE ACCIÓN --- */}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}