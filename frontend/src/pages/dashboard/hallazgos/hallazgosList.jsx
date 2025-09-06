import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Terminal, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useHallazgos } from '@/hooks/hallazgos/useHallazgosHook';
import { useAuth } from '@/context/AuthContext';

export default function HallazgosList() {
    const { isAuthLoading: authLoading } = useAuth();
    const { hallazgos, isLoading, error, eliminarHallazgo } = useHallazgos();

    const [hallazgoToDelete, setHallazgoToDelete] = useState(null);

    const handleDelete = (hallazgo) => {
        setHallazgoToDelete(hallazgo);
    };

    const handleConfirmDelete = async () => {
        if (hallazgoToDelete) {
            await eliminarHallazgo(hallazgoToDelete.id_hallazgo);
            setHallazgoToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setHallazgoToDelete(null);
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Cargando sesión...</span>
            </div>
        );
    }
    
    if (isLoading) {
        return <div className="text-center p-8">Cargando hallazgos...</div>;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Listado de Hallazgos</h1>
                <Button asChild>
                    <Link to="/dashboard/hallazgos/crear">Crear Nuevo Hallazgo</Link>
                </Button>
            </div>

            {(hallazgos || []).length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No se encontraron hallazgos</AlertTitle>
                    <AlertDescription>Aún no has registrado hallazgos.</AlertDescription>
                </Alert>
            ) : (
                <>
                    {hallazgoToDelete && (
                        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                            <CardContent className="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
                                <CardTitle className="mb-4">Confirmar Eliminación</CardTitle>
                                <p className="mb-4">¿Estás seguro de que deseas eliminar el hallazgo #{hallazgoToDelete.id_hallazgo}?</p>
                                <div className="flex justify-center space-x-4">
                                    <Button onClick={handleConfirmDelete} variant="destructive">Eliminar</Button>
                                    <Button onClick={handleCancelDelete} variant="outline">Cancelar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(hallazgos || []).map(hallazgo => (
                            <Card key={hallazgo.id_hallazgo} className="relative">
                                <CardHeader>
                                    <CardTitle>Hallazgo #{hallazgo.id_hallazgo}</CardTitle>
                                    <div className="text-sm text-gray-500">
                                        <p>Fecha: {new Date(hallazgo.fecha_hallazgo).toLocaleDateString()}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4">{hallazgo.descripcion_general_hallazgo || "Sin descripción."}</p>
                                    <div className="flex space-x-2">
                                        <Button asChild variant="outline" size="sm" className="w-1/2">
                                            <Link to={`/dashboard/hallazgos/editar/${hallazgo.id_hallazgo}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </Link>
                                        </Button>
                                        <Button variant="destructive" size="sm" className="w-1/2" onClick={() => handleDelete(hallazgo)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}