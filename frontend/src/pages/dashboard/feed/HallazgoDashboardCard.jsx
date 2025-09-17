// RUTA: frontend/components/dashboard/HallazgoDashboardCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaCamera } from 'react-icons/fa';

// Exportamos como un componente nombrado
export const HallazgoDashboardCard = ({ hallazgo }) => {
    const ubicacion = (hallazgo.municipio && hallazgo.estado)
        ? `${hallazgo.municipio}, ${hallazgo.estado}`
        // Esta parte es por si los datos vienen de la vista de detalle, que son anidados
        : (hallazgo.ubicacion_hallazgo?.municipio && hallazgo.ubicacion_hallazgo?.estado)
            ? `${hallazgo.ubicacion_hallazgo.municipio}, ${hallazgo.ubicacion_hallazgo.estado}`
            : 'Ubicación no disponible';

    const titulo = (hallazgo.nombre && hallazgo.apellido_paterno)
        ? `${hallazgo.nombre} ${hallazgo.apellido_paterno}`
        : `Hallazgo en ${hallazgo.municipio || hallazgo.ubicacion_hallazgo?.municipio || 'ubicación'}`;
        
    const fechaFormateada = hallazgo.fecha_hallazgo 
        ? new Date(hallazgo.fecha_hallazgo).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Fecha desconocida';

    return (
        <Link to={`/dashboard/hallazgos-list/${hallazgo.id_hallazgo}`} className="h-full block">
            <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-0">
                    {hallazgo.foto_hallazgo ? (
                        <img src={hallazgo.foto_hallazgo} alt={`Foto de ${titulo}`} className="w-full h-48 object-cover" />
                    ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <FaCamera className="text-gray-400 text-6xl" />
                        </div>
                    )}
                </CardContent>
                <CardHeader className="flex-grow">
                    <CardTitle className="text-lg text-blue-800">{titulo}</CardTitle>
                    <CardDescription>
                        {hallazgo.edad_estimada ? `${hallazgo.edad_estimada} años` : ''}{hallazgo.genero ? `, ${hallazgo.genero}` : ''}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col items-start text-xs text-gray-600 space-y-1">
                    <div className="flex items-center"><FaMapMarkerAlt className="mr-2 text-gray-400" /><span>{ubicacion}</span></div>
                    <div className="flex items-center"><FaRegCalendarAlt className="mr-2 text-gray-400" /><span>Reportado: {fechaFormateada}</span></div>
                </CardFooter>
            </Card>
        </Link>
    );
};