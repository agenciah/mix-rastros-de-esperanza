// RUTA: frontend/hooks/useFeedHallazgos.js

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';

export const useFeedHallazgos = (limit = 12) => { // Aumentamos el límite a 12 para llenar la cuadrícula
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

    // Efecto para la búsqueda inicial y con debounce
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        
        debounceTimeout.current = setTimeout(() => {
            setPage(1);
            fetchHallazgos(searchTerm, 1);
        }, 300); // 300ms de espera

        return () => clearTimeout(debounceTimeout.current);
    }, [searchTerm, fetchHallazgos]);

    // Efecto para cargar más resultados
    const loadMore = () => {
        if (hasMore && !isLoading) {
            setPage(prevPage => prevPage + 1);
        }
    };
     useEffect(() => {
        if (page > 1) {
            fetchHallazgos(searchTerm, page);
        }
    }, [page]);


    return { hallazgos, isLoading, error, searchTerm, setSearchTerm, hasMore, loadMore };
};