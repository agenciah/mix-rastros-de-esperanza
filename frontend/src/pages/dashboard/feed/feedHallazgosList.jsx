// src/pages/dashboard/hallazgos/HallazgosList.jsx

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa';

const FeedHallazgosList = () => {
    const [hallazgos, setHallazgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; // Número de hallazgos por página

    const fetchHallazgos = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/hallazgos/list?page=${page}&limit=${limit}`);
            const newHallazgos = response.data;
            setHallazgos(prevHallazgos => [...prevHallazgos, ...newHallazgos]);
            setHasMore(newHallazgos.length === limit);
        } catch (err) {
            console.error('Error al obtener la lista de hallazgos:', err);
            setError('No se pudo cargar la lista de hallazgos. Intente de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHallazgos();
    }, [page]); // El efecto se ejecuta cada vez que 'page' cambia

    const handleLoadMore = () => {
        setPage(prevPage => prevPage + 1);
    };

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Listado de Hallazgos</h1>
            {hallazgos.length === 0 && !loading && (
                <p className="text-center text-gray-500">No hay hallazgos reportados en este momento.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hallazgos.map(hallazgo => (
                    <div key={hallazgo.id_hallazgo} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-blue-600">{hallazgo.nombre} {hallazgo.apellido_paterno}</h3>
                            </div>
                        </div>
                        <div className="space-y-2 text-gray-600 text-sm">
                            <div className="flex items-center">
                                <FaRegCalendarAlt className="mr-2 text-gray-400" />
                                <span>Fecha: {new Date(hallazgo.fecha_hallazgo).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                                <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                <span>Ubicación: {hallazgo.municipio}, {hallazgo.estado}</span>
                            </div>
                        </div>
                        {/* Aquí puedes agregar más detalles o un botón para ver la ficha completa */}
                    </div>
                ))}
            </div>
            {loading && (
                <div className="text-center py-8">Cargando más hallazgos...</div>
            )}
            {!loading && hasMore && (
                <div className="text-center py-8">
                    <button
                        onClick={handleLoadMore}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:bg-blue-700 transition-colors"
                    >
                        Cargar más
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeedHallazgosList;