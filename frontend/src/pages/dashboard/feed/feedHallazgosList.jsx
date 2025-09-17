// RUTA: src/pages/dashboard/hallazgos/FeedHallazgosList.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Search, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa';
import { useFeedHallazgos } from '@/hooks/useFeedHallazgos';

// --- Sub-componente HallazgoCard (Corregido) ---
const HallazgoCard = ({ hallazgo }) => {
    const ubicacion = (hallazgo.municipio && hallazgo.estado)
        ? `${hallazgo.municipio}, ${hallazgo.estado}`
        : 'Ubicación no disponible';

    const titulo = (hallazgo.nombre && hallazgo.apellido_paterno)
        ? `${hallazgo.nombre} ${hallazgo.apellido_paterno}`
        : `Hallazgo en ${hallazgo.municipio || 'ubicación desconocida'}`;

    return (
        <Card className="flex flex-col justify-between transition-all hover:shadow-lg overflow-hidden">
            {/* ✅ CORRECCIÓN: La ruta ahora apunta a 'hallazgos-list' */}
            <Link to={`/dashboard/hallazgos-list/${hallazgo.id_hallazgo}`} className="flex flex-col flex-grow">
                <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                    {hallazgo.foto_hallazgo ? (
                        <img src={hallazgo.foto_hallazgo} alt={`Foto de ${titulo}`} className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="text-slate-400 w-12 h-12" />
                    )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                    <CardTitle className="text-md font-semibold text-gray-800 truncate">{titulo}</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                        <FaRegCalendarAlt className="inline mr-1.5" />
                        {new Date(hallazgo.fecha_hallazgo).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </CardDescription>
                    <p className="text-sm text-gray-500 mt-1">
                        <FaMapMarkerAlt className="inline mr-1.5" />
                        {ubicacion}
                    </p>
                    <div className="flex-grow" /> 
                    <Button variant="link" className="p-0 h-auto text-blue-600 self-start mt-2">
                        Ver detalles →
                    </Button>
                </div>
            </Link>
        </Card>
    );
};


// --- Componente Principal (Simplificado) ---
const FeedHallazgosList = () => {
    const navigate = useNavigate();
    const { hallazgos, isLoading, error, searchTerm, setSearchTerm, hasMore, loadMore } = useFeedHallazgos();

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="flex items-center mb-6">
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Listado de Hallazgos</h1>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Buscar por nombre, descripción, vestimenta, ubicación..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {hallazgos.length === 0 && isLoading && (
                 <div className="text-center py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            )}

            {hallazgos.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 mt-8">No se encontraron hallazgos que coincidan con la búsqueda.</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {hallazgos.map(hallazgo => (
                    <HallazgoCard key={hallazgo.id_hallazgo} hallazgo={hallazgo} />
                ))}
            </div>

            {isLoading && hallazgos.length > 0 && (
                <div className="text-center py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            )}
            
            {!isLoading && hasMore && (
                <div className="text-center py-8">
                    <Button onClick={loadMore}>Cargar más</Button>
                </div>
            )}
        </div>
    );
};

export default FeedHallazgosList;