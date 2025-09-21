// RUTA: src/pages/dashboard/feed/FeedFichasList.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { FaUser, FaRegCalendarAlt, FaArrowLeft, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';

// --- Componente de Tarjeta para cada Ficha ---
const FichaCard = ({ ficha }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col justify-between">
        <div>
            {ficha.foto_perfil ? (
                <img src={ficha.foto_perfil} alt={`Foto de ${ficha.nombre}`} className="w-full h-48 object-cover rounded-md mb-4" />
            ) : (
                <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                    <FaUser className="text-gray-400 text-4xl" />
                </div>
            )}
            <h3 className="text-xl font-semibold text-blue-600">
                {ficha.nombre} {ficha.apellido_paterno}
            </h3>
            <div className="space-y-2 text-gray-600 text-sm mt-2">
                <div className="flex items-center">
                    <FaRegCalendarAlt className="mr-2 text-gray-400" />
                    <span>Desapareció: {new Date(ficha.fecha_desaparicion).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-gray-400" />
                    <span>En: {ficha.municipio}, {ficha.estado}</span>
                </div>
            </div>
        </div>
        <div className="mt-4 text-right">
            <Link
                to={`/dashboard/fichas-list/${ficha.id_ficha}`} // <-- RUTA AL DETALLE
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
                Ver detalles completos
            </Link>
        </div>
    </div>
);


// --- Componente Principal de la Lista de Fichas ---
const FeedFichasList = () => {
    const navigate = useNavigate();
    const [fichas, setFichas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para la búsqueda
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 12; // Ajustado para mostrar 3 o 4 por fila
    const debounceTimeout = useRef(null);

    // Función para obtener las fichas
    const fetchFichas = async (term = '', pageToFetch = 1) => {
        setLoading(true);
        setError(null);
        
        try {
            // Usamos el nuevo endpoint público
            const offset = (pageToFetch - 1) * limit;
            const url = `/fichas/publicas?limit=${limit}&offset=${offset}`; // Búsqueda se hará en el frontend por ahora
            
            const response = await api.get(url);
            const newFichas = response.data.data;

            setFichas(prevFichas => pageToFetch === 1 ? newFichas : [...prevFichas, ...newFichas]);
            setHasMore(newFichas.length === limit);
        } catch (err) {
            console.error('Error al obtener la lista de fichas:', err);
            setError('No se pudo cargar la lista de fichas. Intente de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    // Efecto para la carga inicial
    useEffect(() => {
        fetchFichas('', 1);
    }, []);

    // Efecto para la paginación (Cargar más)
    useEffect(() => {
        if (page > 1) {
            fetchFichas(searchTerm, page);
        }
    }, [page]);

    const handleLoadMore = () => {
        setPage(prevPage => prevPage + 1);
    };
    
    // Filtrado en el frontend (simple por ahora)
    const filteredFichas = fichas.filter(ficha => 
        `${ficha.nombre} ${ficha.apellido_paterno} ${ficha.municipio} ${ficha.estado}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4">
                    <FaArrowLeft className="mr-2" />
                    Volver al Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Fichas de Búsqueda Públicas</h1>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Buscar por nombre o ubicación..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {loading && fichas.length === 0 && <p className="text-center">Cargando fichas...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFichas.map(ficha => (
                    <FichaCard key={ficha.id_ficha} ficha={ficha} />
                ))}
            </div>

            {filteredFichas.length === 0 && !loading && (
                 <p className="text-center text-gray-500">No se encontraron fichas que coincidan con la búsqueda.</p>
            )}

            {!loading && hasMore && (
                <div className="text-center py-8">
                    <button
                        onClick={handleLoadMore}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:bg-blue-700"
                    >
                        Cargar más
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeedFichasList;