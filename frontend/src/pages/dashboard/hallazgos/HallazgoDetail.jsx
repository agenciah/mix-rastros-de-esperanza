// src/pages/dashboard/hallazgos/HallazgoDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHallazgos } from '@/hooks/hallazgos/useHallazgosHook';
import { useMessaging } from '@/hooks/useMessaging';
import {
    FaUser,
    FaMapMarkerAlt,
    FaRegCalendarAlt,
    FaArrowLeft,
    FaCamera,
    FaEnvelope
} from 'react-icons/fa';

const HallazgoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getHallazgoById, isLoading, error } = useHallazgos();
    const { startConversation, isLoading: isStartingChat } = useMessaging();

    const [hallazgo, setHallazgo] = useState(null);

    useEffect(() => {
        const fetchAndSetHallazgo = async () => {
            const data = await getHallazgoById(id);
            if (data) {
                setHallazgo(data);
            }
        };

        fetchAndSetHallazgo();
    }, [id, getHallazgoById]);

    const handleStartConversation = async () => {
        // Validación del ID del usuario
        if (!hallazgo || !hallazgo.id_usuario_buscador) {
            console.error("No se pudo obtener el ID del usuario para iniciar la conversación.");
            alert("No se pudo encontrar el usuario para contactar. Por favor, intente de nuevo más tarde.");
            return;
        }

        try {
            // Llamamos a la función con el ID correcto
            const conversationId = await startConversation(hallazgo.id_usuario_buscador);

            // Redireccionamos a la página de mensajes
            navigate(`/mensajes/${conversationId}`);
        } catch (err) {
            console.error('Error al iniciar la conversación:', err);
            alert('Hubo un error al iniciar la conversación. Por favor, intente de nuevo.');
        }
    };

    if (isLoading) {
        return <div className="text-center py-10">Cargando detalles...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    if (!hallazgo) {
        return <div className="text-center py-10">Hallazgo no encontrado.</div>;
    }

    const nombreCompleto = `${hallazgo.nombre || ''} ${hallazgo.segundo_nombre || ''} ${hallazgo.apellido_paterno || ''} ${hallazgo.apellido_materno || ''}`.trim();

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
                >
                    <FaArrowLeft className="mr-2" />
                    Volver
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Detalles del Hallazgo</h1>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                {/* Nueva Sección de Fotos (opcional) */}
                <div className="flex justify-center items-center mb-6">
                    {/* Placeholder para la foto principal */}
                    <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                        <FaCamera className="text-4xl" />
                    </div>
                </div>

                {/* 1. Sección de Datos Principales */}
                <div className="space-y-4 border-b pb-4">
                    <p className="text-lg font-semibold text-blue-600">
                        Nombre: {nombreCompleto || 'Sin identificar'}
                    </p>
                    <div className="flex items-center text-gray-600">
                        <FaRegCalendarAlt className="mr-2 text-gray-400" />
                        <span>
                            Fecha del hallazgo: {hallazgo.fecha_hallazgo ? new Date(hallazgo.fecha_hallazgo).toLocaleDateString() : 'Desconocida'}
                        </span>
                    </div>

                    {/* Sección de Ubicación con más detalles */}
                    <div className="flex items-center text-gray-600">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span>
                            {hallazgo.ubicacion_hallazgo?.calle && `Calle: ${hallazgo.ubicacion_hallazgo.calle}, `}
                            {hallazgo.ubicacion_hallazgo?.localidad && `Localidad: ${hallazgo.ubicacion_hallazgo.localidad}, `}
                            {hallazgo.ubicacion_hallazgo?.municipio && `Municipio: ${hallazgo.ubicacion_hallazgo.municipio}, `}
                            {hallazgo.ubicacion_hallazgo?.estado || 'Desconocido'}
                        </span>
                    </div>

                    {/* Descripción General del Hallazgo */}
                    {hallazgo.descripcion_general_hallazgo && (
                        <p className="text-gray-700">Descripción: {hallazgo.descripcion_general_hallazgo}</p>
                    )}

                    {/* Tipo de Lugar del Hallazgo */}
                    {hallazgo.tipo_lugar && (
                        <p className="text-gray-700">Tipo de lugar: {hallazgo.tipo_lugar}</p>
                    )}
                </div>

                {/* 2. Sección de Rasgos Físicos (Características) */}
                {hallazgo.caracteristicas?.length > 0 && (
                    <div className="border-b pb-4">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Rasgos Físicos</h4>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                            {hallazgo.caracteristicas.map((caracteristica, index) => (
                                <li key={index}>
                                    <strong>{caracteristica.nombre_parte || 'Parte desconocida'}</strong>: {caracteristica.tipo_caracteristica || 'Sin característica'}. {caracteristica.descripcion}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Sección de Vestimenta */}
                {hallazgo.vestimenta?.length > 0 && (
                    <div className="border-b pb-4">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Vestimenta</h4>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                            {hallazgo.vestimenta.map((prenda, index) => (
                                <li key={index}>
                                    <strong>{prenda.tipo_prenda || 'Prenda desconocida'}</strong>: {prenda.color || 'Sin color'}. {prenda.caracteristica_especial}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 4. Sección de Usuario que reportó */}
                <div className="pt-4 flex items-center justify-between">
                    <div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Usuario que reportó</h4>
                        <div className="flex items-center">
                            <FaUser className="text-gray-500 mr-2" />
                            <span className="text-blue-600 font-semibold">
                                {hallazgo.nombre_usuario || 'Usuario Desconocido'}
                            </span>
                        </div>
                    </div>
                    {/* Botón para iniciar conversación */}
                    <button
                        onClick={handleStartConversation}
                        disabled={isStartingChat} // Deshabilita el botón mientras se procesa la solicitud
                        className="..."
                    >
                        {isStartingChat ? (
                            'Iniciando...' // O un spinner
                        ) : (
                            <>
                                <FaEnvelope className="mr-2" />
                                Contactar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HallazgoDetail;