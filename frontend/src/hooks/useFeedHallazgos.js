// RUTA: src/hooks/useFeedHallazgos.js

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';

export const useFeedHallazgos = (limit = 10) => {
    const [hallazgos, setHallazgos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const debounceTimeout = useRef(null);

    const fetchHallazgos = useCallback(async (currentSearchTerm, pageToFetch) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const offset = (pageToFetch - 1) * limit;
            const params = { limit, offset, searchTerm: currentSearchTerm };
            
            // Usamos el endpoint de búsqueda del feed, que es más simple
            const response = await api.get('/api/hallazgos/feed/search', { params });
            const newHallazgos = response.data.data || [];

            setHallazgos(prev => pageToFetch === 1 ? newHallazgos : [...prev, ...newHallazgos]);
            setHasMore(newHallazgos.length === limit);

        } catch (err) {
            console.error('Error fetching hallazgos:', err);
            setError('No se pudieron cargar los hallazgos.');
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    // Efecto para manejar el cambio en el término de búsqueda con debounce
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            setPage(1); // Reinicia la página con cada nueva búsqueda
            fetchHallazgos(searchTerm, 1);
        }, 500); // 500ms de espera

        return () => clearTimeout(debounceTimeout.current);
    }, [searchTerm, fetchHallazgos]);

    // Efecto para cargar más resultados al cambiar de página
    useEffect(() => {
        if (page > 1) {
            fetchHallazgos(searchTerm, page);
        }
    }, [page, searchTerm, fetchHallazgos]);

    const loadMore = () => {
        if (hasMore && !isLoading) {
            setPage(prevPage => prevPage + 1);
        }
    };

    return { hallazgos, isLoading, error, searchTerm, setSearchTerm, hasMore, loadMore };
};