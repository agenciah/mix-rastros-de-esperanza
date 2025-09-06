// frontend/components/dashboard/FeedDashboard.jsx

import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useFichasRecientes } from '@/hooks/useFichasRecientes';
import { Link } from 'react-router-dom';

// Importaciones de los componentes de shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FaUser, FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa';

const FichaCard = ({ ficha }) => {
    const nombreCompleto = `${ficha.nombre || ''} ${ficha.apellido_paterno || ''}`.trim();

    let fechaFormateada = 'Fecha no disponible';
    if (ficha.fecha_desaparicion) {
        try {
            fechaFormateada = new Date(ficha.fecha_desaparicion).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            console.error("Fecha inválida:", ficha.fecha_desaparicion);
        }
    }

    const ubicacion = `${ficha.municipio || ''}, ${ficha.estado || ''}`.trim().replace(/^,|,$/g, '') || 'Ubicación no disponible';

    const edadGenero = [
        ficha.edad_estimada ? `${ficha.edad_estimada} años` : null,
        ficha.genero
    ].filter(Boolean).join(', ') || 'Datos no disponibles';

    return (
        <Link to={`/dashboard/fichas-list/${ficha.id_ficha}`} className="h-full block">
            <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-0">
                    {ficha.foto_perfil ? (
                        <img 
                            src={ficha.foto_perfil} 
                            alt={`Foto de ${nombreCompleto}`} 
                            className="w-full h-48 object-cover" 
                        />
                    ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <FaUser className="text-gray-400 text-6xl" />
                        </div>
                    )}
                </CardContent>
                <CardHeader className="flex-grow">
                    <CardTitle className="text-lg text-blue-800">{nombreCompleto}</CardTitle>
                    <CardDescription>{edadGenero}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col items-start text-xs text-gray-600 space-y-1">
                    <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span>{ubicacion}</span>
                    </div>
                    <div className="flex items-center">
                        <FaRegCalendarAlt className="mr-2 text-gray-400" />
                        <span>Desaparición: {fechaFormateada}</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
};

// --- Componentes de Tarjetas ---
const HallazgoCard = ({ hallazgo }) => {
    // Manejo más robusto de la fecha, asumiendo el formato YYYY-MM-DD
    let fechaFormateada = 'Fecha desconocida';
    if (hallazgo.fecha_hallazgo) {
        try {
            const date = new Date(hallazgo.fecha_hallazgo);
            fechaFormateada = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            console.error('Error al parsear la fecha:', e);
            fechaFormateada = 'Fecha inválida';
        }
    }

    return (
        <Card className="h-full w-[250px] md:w-full flex flex-col justify-between">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base truncate">Hallazgo Reportado</CardTitle>
                <CardDescription className="text-sm">
                    <span className="font-semibold text-blue-700 truncate">
                        {hallazgo.nombre} {hallazgo.apellido_paterno}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm space-y-1">
                <p className="text-xs text-gray-500">
                    <span className="font-bold">Fecha:</span> {fechaFormateada}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    <span className="font-bold">Estado:</span> {hallazgo.estado || 'Desconocido'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    <span className="font-bold">Municipio:</span> {hallazgo.municipio || 'Desconocido'}
                </p>
            </CardContent>
        </Card>
    );
};

const CasoExitoCard = ({ caso }) => (
    <Card className="h-full w-[250px] md:w-full flex flex-col justify-between border-green-500">
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base text-green-700 truncate">Caso Resuelto</CardTitle>
            <CardDescription className="text-sm">
                <span className="font-semibold truncate">
                    {caso.nombre} {caso.apellido_paterno}
                </span>
            </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <p className="text-xs text-gray-500">
                ID de Ficha: {caso.id_ficha}
            </p>
        </CardContent>
    </Card>
);

// --- Componente Principal ---
const FeedDashboard = () => {
    const { data, loading, error } = useDashboardData();
    // 2. LLAMAMOS A AMBOS HOOKS DE FORMA INDEPENDIENTE
    const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardData();
    const { fichasRecientes, loading: fichasLoading, error: fichasError } = useFichasRecientes();

    if (loading) {
        return <div className="text-center py-8">Cargando datos...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    const { globalStats, casosEncontrados, actividadReciente, mensajesAdministrador } = data;

    return (
        <div className="p-4 md:p-6 space-y-8 bg-gray-50">
            {/* Sección de Estadísticas Globales */}
            <section>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                    <Card className="text-center p-2 md:p-4">
                        <p className="text-xs text-gray-500">Fichas Publicadas</p>
                        <CardTitle className="text-3xl font-bold">{globalStats.totalFichas}</CardTitle>
                    </Card>
                    <Card className="text-center p-2 md:p-4">
                        <p className="text-xs text-gray-500">Hallazgos Reportados</p>
                        <CardTitle className="text-3xl font-bold">{globalStats.totalHallazgos}</CardTitle>
                    </Card>
                    <Card className="text-center p-2 md:p-4">
                        <p className="text-xs text-gray-500">Casos Resueltos</p>
                        <CardTitle className="text-3xl font-bold">{globalStats.casosResueltos}</CardTitle>
                    </Card>
                </div>
            </section>

             {/* SECCIÓN DE FICHAS CON SU PROPIO ESTADO DE CARGA Y ERROR */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Últimas Fichas Publicadas</h2>
                    <Link to="fichas-list" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                        Ver todas →
                    </Link>
                </div>
                {fichasLoading && <p className="text-gray-500">Cargando fichas...</p>}
                {fichasError && <p className="text-red-500">{fichasError}</p>}
                {!fichasLoading && !fichasError && (
                    fichasRecientes.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent className="ml-0">
                                {fichasRecientes.map((ficha) => (
                                    <CarouselItem key={ficha.id_ficha} className="basis-[250px] md:basis-1/2 lg:basis-1/3 pr-4">
                                        <FichaCard ficha={ficha} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                    ) : (
                        <p className="text-gray-500">No hay fichas publicadas recientemente.</p>
                    )
                )}
            </section>

            {/* Sección de Últimos Hallazgos */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Últimos Hallazgos</h2>
                    <Link to="hallazgos-list" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                        Ver todos →
                    </Link>
                </div>
                {actividadReciente.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent className="ml-0">
                            {actividadReciente.map((item) => (
                                <CarouselItem key={item.id_hallazgo} className="basis-[250px] md:basis-1/2 lg:basis-1/3 pr-4">
                                    <HallazgoCard hallazgo={item} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                    </Carousel>
                ) : (
                    <p className="text-gray-500">No hay hallazgos recientes.</p>
                )}
            </section>

            {/* Sección de Últimos Casos de Éxito */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Casos de Éxito</h2>
                {casosEncontrados.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent className="ml-0">
                            {casosEncontrados.map((caso) => (
                                <CarouselItem key={caso.id_ficha} className="basis-[250px] md:basis-1/2 lg:basis-1/3 pr-4">
                                    <CasoExitoCard caso={caso} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                    </Carousel>
                ) : (
                    <p className="text-gray-500">No hay casos de éxito recientes.</p>
                )}
            </section>
            
            {/* Sección de Mensajes del Administrador */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Mensajes del Administrador</h2>
                <Card>
                    <CardContent className="p-4">
                        {mensajesAdministrador.length > 0 ? (
                            mensajesAdministrador.map((mensaje) => (
                                <div key={mensaje.id_mensaje} className="border-b last:border-b-0 py-2">
                                    <p className="font-semibold text-gray-800 truncate">{mensaje.titulo}</p>
                                    <p className="text-sm text-gray-600 truncate">{mensaje.contenido}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(mensaje.fecha_creacion).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No hay mensajes nuevos del administrador.</p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};

export default FeedDashboard;