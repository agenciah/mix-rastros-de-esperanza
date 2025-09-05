// src/components/Admin/MatchDetailModal.jsx

import React, { useState, useEffect } from 'react';
import useMatchDetail from '../../hooks/useMatchDetail'; // Lo crearemos en el siguiente paso
import apiAdmin from '../../lib/axiosAdmin';

const MatchDetailModal = ({ match, onClose, onUpdate }) => {
    const { matchDetail, isLoading, error } = useMatchDetail(match.id_posible_coincidencia);
    const [estadoRevision, setEstadoRevision] = useState('');
    const [comentarios, setComentarios] = useState('');

    useEffect(() => {
        if (matchDetail) {
            setEstadoRevision(matchDetail.estado_revision);
            setComentarios(matchDetail.comentarios_admin || '');
        }
    }, [matchDetail]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                <div className="bg-white p-5 rounded-lg shadow-lg">
                    <p>Cargando detalles de la coincidencia...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                <div className="bg-white p-5 rounded-lg shadow-lg">
                    <p className="text-red-500">{error}</p>
                    <button onClick={onClose} className="mt-4 bg-gray-300 p-2 rounded">Cerrar</button>
                </div>
            </div>
        );
    }
    
    const handleSaveReview = async () => {
    try {
        // 🚨 CAMBIO AQUÍ: elimina el '/admin' duplicado
        await apiAdmin.put(`/matches/${match.id_posible_coincidencia}/review`, {
            estado: estadoRevision,
            comentarios: comentarios,
        });
        alert('Revisión guardada con éxito.');
        onUpdate();
        onClose();
    } catch (err) {
        console.error('Error al guardar la revisión:', err);
        alert('No se pudo guardar la revisión. Intenta de nuevo.');
    }
};

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative p-8 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
                <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" onClick={onClose}>
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-center mb-6">Detalles de la Coincidencia</h2>

                <div className="flex justify-around items-start space-x-4 mb-6">
                    {/* Sección de la Ficha de Búsqueda */}
                    <div className="w-1/2 p-4 bg-blue-50 rounded-lg shadow-inner">
                        <h3 className="text-xl font-semibold mb-2 text-blue-800">Ficha de Búsqueda</h3>
                        <p><strong>Nombre:</strong> {matchDetail.ficha.nombre} {matchDetail.ficha.apellido_paterno}</p>
                        <p><strong>ID:</strong> {matchDetail.ficha.id_ficha}</p>
                        <p><strong>Fecha Desaparición:</strong> {new Date(matchDetail.ficha.fecha_desaparicion).toLocaleDateString()}</p>
                        <p><strong>Ubicación:</strong> {matchDetail.ficha.estado}, {matchDetail.ficha.municipio}</p>
                        <p><strong>Rasgos Físicos:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            {matchDetail.ficha.rasgos_fisicos.map(rasgo => (
                                <li key={rasgo.id_rasgo}>{rasgo.tipo_rasgo} - {rasgo.nombre_parte_cuerpo}</li>
                            ))}
                        </ul>
                        <p className="mt-2"><strong>Vestimenta:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            {matchDetail.ficha.vestimenta.map(prenda => (
                                <li key={prenda.id_vestimenta}>{prenda.tipo_prenda_nombre} ({prenda.color})</li>
                            ))}
                        </ul>
                    </div>

                    {/* Separador visual y puntaje */}
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold text-gray-700">VS</span>
                        <div className="mt-2 text-center">
                            <p className="text-sm">Puntaje</p>
                            <span className="text-3xl font-bold text-green-600">{matchDetail.puntaje}</span>
                        </div>
                    </div>

                    {/* Sección del Hallazgo Reportado */}
                    <div className="w-1/2 p-4 bg-green-50 rounded-lg shadow-inner">
                        <h3 className="text-xl font-semibold mb-2 text-green-800">Hallazgo Reportado</h3>
                        <p><strong>ID:</strong> {matchDetail.hallazgo.id_hallazgo}</p>
                        <p><strong>Fecha Hallazgo:</strong> {new Date(matchDetail.hallazgo.fecha_hallazgo).toLocaleDateString()}</p>
                        <p><strong>Ubicación:</strong> {matchDetail.hallazgo.ubicacion_hallazgo.estado}, {matchDetail.hallazgo.ubicacion_hallazgo.municipio}</p>
                        <p><strong>Características:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            {matchDetail.hallazgo.rasgos_fisicos.map(rasgo => (
                                <li key={rasgo.id_hallazgo_caracteristica}>{rasgo.tipo_caracteristica} - {rasgo.nombre_parte_cuerpo}</li>
                            ))}
                        </ul>
                        <p className="mt-2"><strong>Vestimenta:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            {matchDetail.hallazgo.vestimenta.map(prenda => (
                                <li key={prenda.id_hallazgo_vestimenta}>{prenda.tipo_prenda_nombre} ({prenda.color})</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sección de Revisión del Administrador */}
                <div className="p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-bold mb-2">Revisión de la Coincidencia</h4>
                    <div className="flex items-center space-x-4 mb-4">
                        <label htmlFor="estado" className="font-medium">Estado:</label>
                        <select
                            id="estado"
                            value={estadoRevision}
                            onChange={(e) => setEstadoRevision(e.target.value)}
                            className="border p-2 rounded"
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="revisada">Revisada</option>
                            <option value="descartada">Descartada</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="comentarios" className="font-medium">Comentarios:</label>
                        <textarea
                            id="comentarios"
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                            className="w-full p-2 border rounded mt-1"
                            rows="3"
                        ></textarea>
                    </div>
                    <button
                        onClick={handleSaveReview}
                        className="mt-4 w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
                    >
                        Guardar Revisión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchDetailModal;