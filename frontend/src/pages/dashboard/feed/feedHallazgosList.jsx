// src/pages/dashboard/hallazgos/HallazgosList.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/axios';
import { FaMapMarkerAlt, FaRegCalendarAlt, FaArrowLeft } from 'react-icons/fa';

const FeedHallazgosList = () => {
    const navigate = useNavigate();
    const [hallazgos, setHallazgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; // Número de hallazgos por página

    const fetchHallazgos = async (pageToFetch) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/feed/list?page=${pageToFetch}&limit=${limit}`);
            const newHallazgos = response.data;
            
            setHallazgos(prevHallazgos => pageToFetch === 1 ? newHallazgos : [...prevHallazgos, ...newHallazgos]);
            setHasMore(newHallazgos.length === limit);
        } catch (err) {
            console.error('Error al obtener la lista de hallazgos:', err);
            setError('No se pudo cargar la lista de hallazgos. Intente de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHallazgos(page);
    }, [page]);

    const handleLoadMore = () => {
        setPage(prevPage => prevPage + 1);
    };

    const handleGoBack = () => {
        navigate('/dashboard');
    };

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <button onClick={handleGoBack} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4">
                    <FaArrowLeft className="mr-2" />
                    Volver al Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Listado de Hallazgos</h1>
            </div>

            {hallazgos.length === 0 && !loading && (
                <p className="text-center text-gray-500">No hay hallazgos reportados en este momento.</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hallazgos.map(hallazgo => (
                    <div key={hallazgo.id_hallazgo} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-blue-600">
                                        {hallazgo.nombre && hallazgo.apellido_paterno
                                            ? `${hallazgo.nombre} ${hallazgo.apellido_paterno}`
                                            : hallazgo.municipio && hallazgo.estado
                                            ? `Hallazgo en ${hallazgo.municipio}`
                                            : 'Hallazgo sin identificar'}
                                    </h3>
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
                        </div>
                        <div className="mt-4 text-right">
                            <Link
                                to={`${hallazgo.id_hallazgo}`}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Ver detalles completos
                            </Link>
                        </div>
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