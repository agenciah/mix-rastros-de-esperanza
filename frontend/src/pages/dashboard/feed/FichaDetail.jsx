// RUTA: src/pages/dashboard/feed/FichaDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/axios'; // Usaremos api directamente para esta llamada
import { useMessaging } from '@/hooks/useMessaging'; // Asumiendo que quieres contactar al creador
import {
    FaUser, FaMapMarkerAlt, FaRegCalendarAlt, FaArrowLeft, FaCamera,
    FaEnvelope, FaRulerVertical, FaWeight, FaHourglassHalf, FaTransgender
} from 'react-icons/fa';

const FichaDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { startConversation, isLoading: isStartingChat } = useMessaging();

    const [ficha, setFicha] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFicha = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get(`/api/fichas/${id}`);
                setFicha(response.data.data);
            } catch (err) {
                console.error("Error al obtener la ficha:", err);
                setError("No se pudo cargar la ficha. Es posible que no exista o haya ocurrido un error.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFicha();
    }, [id]);

    const handleStartConversation = async () => {
        if (!ficha || !ficha.id_usuario_creador) {
            alert("No se pudo encontrar al usuario creador de la ficha.");
            return;
        }
        const conversationId = await startConversation(ficha.id_usuario_creador);
        navigate(`/dashboard/mensajes/${conversationId}`);
    };

    if (isLoading) return <div className="text-center py-10">Cargando detalles de la ficha...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
    if (!ficha) return <div className="text-center py-10">Ficha no encontrada.</div>;

    const nombreCompleto = `${ficha.nombre || ''} ${ficha.segundo_nombre || ''} ${ficha.apellido_paterno || ''} ${ficha.apellido_materno || ''}`.trim();

    return (
        <div className="container mx-auto p-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4 mb-6"
            >
                <FaArrowLeft className="mr-2" />
                Volver a la lista
            </button>

            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                <div className="md:flex md:space-x-8">
                    {/* Sección de Foto */}
                    <div className="flex-shrink-0 mb-6 md:mb-0">
                        {ficha.foto_perfil ? (
                            <img src={ficha.foto_perfil} alt={`Foto de ${nombreCompleto}`} className="w-48 h-48 mx-auto object-cover rounded-lg shadow-md" />
                        ) : (
                            <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                                <FaCamera className="text-5xl text-gray-400" />
                            </div>
                        )}
                    </div>
                    {/* Sección de Datos Principales */}
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold text-gray-800">{nombreCompleto}</h1>
                        <p className="text-lg text-red-600 font-semibold">PERSONA DESAPARECIDA</p>
                        
                        <div className="mt-4 space-y-2 text-gray-700">
                             <div className="flex items-center">
                                <FaRegCalendarAlt className="mr-3 text-gray-400" />
                                <span>
                                    Fecha de desaparición: <strong>{new Date(ficha.fecha_desaparicion).toLocaleDateString()}</strong>
                                </span>
                            </div>
                            <div className="flex items-start">
                                <FaMapMarkerAlt className="mr-3 mt-1 text-gray-400" />
                                <span>
                                    Lugar: <strong>{ficha.ubicacion_desaparicion?.municipio}, {ficha.ubicacion_desaparicion?.estado}</strong>
                                </span>
                            </div>
                             <div className="flex items-center">
                                <p>Tipo de lugar: <strong>{ficha.tipo_lugar}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Datos Físicos */}
                <div className="border-t pt-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Datos Físicos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-700">
                        {ficha.genero && <div><FaTransgender className="inline mr-2 text-gray-400"/>Género: <strong>{ficha.genero}</strong></div>}
                        {ficha.edad_estimada && <div><FaHourglassHalf className="inline mr-2 text-gray-400"/>Edad: <strong>{ficha.edad_estimada} años</strong></div>}
                        {ficha.estatura && <div><FaRulerVertical className="inline mr-2 text-gray-400"/>Estatura: <strong>{ficha.estatura} cm</strong></div>}
                        {ficha.peso && <div><FaWeight className="inline mr-2 text-gray-400"/>Peso: <strong>{ficha.peso} kg</strong></div>}
                        {ficha.complexion && <div><FaUser className="inline mr-2 text-gray-400"/>Complexión: <strong>{ficha.complexion}</strong></div>}
                    </div>
                </div>
                
                {/* Rasgos Particulares */}
                {ficha.rasgos_fisicos?.length > 0 && (
                    <div className="border-t pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Rasgos Particulares</h2>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {ficha.rasgos_fisicos.map((rasgo, index) => (
                                <li key={index}>
                                    <strong>{rasgo.nombre_parte} ({rasgo.tipo_rasgo}):</strong> {rasgo.descripcion_detalle}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Vestimenta */}
                {ficha.vestimenta?.length > 0 && (
                    <div className="border-t pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Vestimenta</h2>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {ficha.vestimenta.map((prenda, index) => (
                                <li key={index}>
                                    <strong>{prenda.tipo_prenda}</strong> color {prenda.color}
                                    {prenda.marca && `, marca ${prenda.marca}`}
                                    {prenda.caracteristica_especial && `. (${prenda.caracteristica_especial})`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                 {/* Contacto */}
                <div className="border-t pt-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">¿Tienes información?</h2>
                        <p className="text-gray-600">Contacta al usuario que creó la ficha.</p>
                    </div>
                    <button
                        onClick={handleStartConversation}
                        disabled={isStartingChat}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        {isStartingChat ? 'Iniciando...' : <><FaEnvelope className="mr-2" /> Contactar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FichaDetail;