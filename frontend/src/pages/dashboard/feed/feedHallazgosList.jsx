// src/pages/dashboard/hallazgos/FeedHallazgosList.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { FaMapMarkerAlt, FaRegCalendarAlt, FaArrowLeft, FaSearch } from 'react-icons/fa';

const FeedHallazgosList = () => {
    const navigate = useNavigate();
    const [hallazgos, setHallazgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10;
    
    // Referencia para el temporizador de debounce
    const debounceTimeout = useRef(null);

    // Función principal para la carga y búsqueda de hallazgos
    const fetchHallazgos = async (term = searchTerm, pageToFetch = 1) => {
        setLoading(true);
        setError(null);
        
        try {
            let response;
            let url; // Creamos una variable para la URL
            
            // Si hay un término de búsqueda, usamos la nueva ruta de búsqueda
            if (term.trim() !== '') {
                url = `/api/hallazgos/feed/search?searchTerm=${encodeURIComponent(term)}&limit=${limit}&offset=${(pageToFetch - 1) * limit}`;
            } else {
                // Si no hay término, usamos la ruta general
                url = `/api/hallazgos/?limit=${limit}&offset=${(pageToFetch - 1) * limit}`;
            }

            // AQUI: Agregamos el primer console.log para ver la URL y el término
            console.log(`[Frontend] Término de búsqueda: "${term}"`);
            console.log(`[Frontend] URL de la petición: ${url}`);
            
            response = await api.get(url);

            const newHallazgos = response.data.data;

            // AQUI: Agregamos el segundo console.log para ver el resultado de la petición
            console.log(`[Frontend] Resultados recibidos:`, newHallazgos);

            setHallazgos(prevHallazgos => pageToFetch === 1 ? newHallazgos : [...prevHallazgos, ...newHallazgos]);
            setHasMore(newHallazgos.length === limit);

            // Guardar el estado en sessionStorage
            sessionStorage.setItem('searchTerm', term);
            sessionStorage.setItem('searchResults', JSON.stringify(newHallazgos));
        } catch (err) {
            console.error('Error al obtener la lista de hallazgos:', err);
            setError('No se pudo cargar la lista de hallazgos. Intente de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    // Efecto para la carga inicial y el "debouncing" de la búsqueda
     // useEffect #1: Se ejecuta UNA SOLA VEZ para cargar el estado inicial.
    useEffect(() => {
        const storedSearchTerm = sessionStorage.getItem('searchTerm');
        const storedSearchResults = sessionStorage.getItem('searchResults');
        
        if (storedSearchTerm && storedSearchResults && storedSearchResults !== '[]') {
            setSearchTerm(storedSearchTerm);
            setHallazgos(JSON.parse(storedSearchResults));
            setLoading(false);
        } else {
            // Carga la lista inicial si no hay nada guardado.
            fetchHallazgos('');
        }
    }, []); // El array vacío [] es la clave para que se ejecute solo una vez.

    // useEffect #2: Se ejecuta CADA VEZ que el usuario escribe en el buscador.
    useEffect(() => {
        // Si estamos en la carga inicial (searchTerm aún no se establece desde el storage), no hacemos nada.
        // Esto evita una doble llamada a la API al inicio.
        if (loading && !sessionStorage.getItem('searchTerm')) {
             return;
        }

        if (searchTerm.trim() === '') {
            // Si el usuario borra la búsqueda, limpiamos el storage.
            sessionStorage.removeItem('searchTerm');
            sessionStorage.removeItem('searchResults');
            // Recargamos la lista inicial para que no se quede con los últimos resultados.
            fetchHallazgos('', 1);
            return;
        }

        // Lógica del "debounce" para no hacer peticiones en cada tecla.
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            setPage(1); 
            fetchHallazgos(searchTerm, 1);
        }, 500);

        // Limpieza del temporizador.
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [searchTerm]); // Se ejecuta cada vez que cambia 'searchTerm'.

    // useEffect #3: Para la paginación (este probablemente ya lo tenías bien).
    useEffect(() => {
        if (page > 1) {
            fetchHallazgos(searchTerm, page);
        }
    }, [page]);

    // Manejar el cambio del input de búsqueda
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleLoadMore = () => {
        setPage(prevPage => prevPage + 1);
    };

    const handleGoBack = () => {
        sessionStorage.removeItem('searchTerm');
        sessionStorage.removeItem('searchResults');
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

            {/* Nuevo campo de búsqueda */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Buscar por nombre, descripción, vestimenta, ubicación..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {hallazgos.length === 0 && !loading && (
                <p className="text-center text-gray-500">No se encontraron hallazgos que coincidan con la búsqueda.</p>
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