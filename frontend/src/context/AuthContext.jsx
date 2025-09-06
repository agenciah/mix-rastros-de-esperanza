// RUTA: src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// Función auxiliar para normalizar los datos del usuario. Se mantiene igual.
const normalizeUserData = (userData) => {
    if (userData && typeof userData.plan === 'string') {
        try {
            return { ...userData, plan: JSON.parse(userData.plan) };
        } catch (error) {
            console.error('⚠️ Error al parsear `user.plan`, se dejará como está:', error);
            return userData;
        }
    }
    return userData;
};

export const AuthProvider = ({ children }) => {
    // El estado del usuario se inicializa de forma síncrona desde localStorage. ¡Correcto!
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? normalizeUserData(JSON.parse(storedUser)) : null;
        } catch (error) {
            console.error("Error al leer el usuario del localStorage", error);
            return null;
        }
    });

    // --- MEJORAS ---
    // 1. Renombramos 'loading' a 'isAuthLoading' para mayor claridad.
    // 2. Lo inicializamos en 'true' para indicar que la verificación inicial está pendiente.
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    
    const navigate = useNavigate();

    // 3. Usamos un useEffect para declarar explícitamente que la "carga" inicial ha terminado.
    // Esto se ejecuta solo una vez, justo después del primer render.
    useEffect(() => {
        // La comprobación síncrona del usuario ya se hizo en useState.
        // Por tanto, podemos decir que la carga ha terminado.
        // Si en el futuro necesitas validar un token contra una API, esa lógica asíncrona iría aquí.
        setIsAuthLoading(false);
    }, []);

    const login = (userData, token) => {
        const normalizedUser = normalizeUserData(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };
    
    // 4. Pasamos 'isAuthLoading' en el 'value' del Provider.
    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, isAuthLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);