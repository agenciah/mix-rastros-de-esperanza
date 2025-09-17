// RUTA: src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // Importamos el especialista

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const navigate = useNavigate();
    
    // Contratamos a nuestro especialista en Firebase
    const { signInToFirebase, signOutFromFirebase } = useFirebaseAuth();

    // ✅ 1. LA FUNCIÓN `reauthenticate` SE MANTIENE ESTABLE CON useCallback
    const reauthenticate = useCallback(async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        if (token) {
            try {
                const { data } = await api.get('/api/auth/profile');
                setUser(data.user);
                
                const firebaseTokenRes = await api.get('/api/auth/firebase-token');
                if (firebaseTokenRes.data.success) {
                    await signInToFirebase(firebaseTokenRes.data.firebaseToken);
                }
            } catch (error) {
                console.error("Fallo en la re-autenticación, limpiando sesión.", error);
                localStorage.removeItem('AUTH_TOKEN');
                setUser(null);
                await signOutFromFirebase();
            }
        }
        setIsAuthLoading(false);
    }, [signInToFirebase, signOutFromFirebase]); // Estas dependencias de un hook son estables


    // ✅ 2. EL useEffect AHORA SE EJECUTA SOLO UNA VEZ AL MONTAR EL COMPONENTE
    // El array de dependencias vacío `[]` es la clave para romper el bucle.
    useEffect(() => {
        reauthenticate();
    }, []); // ◀️ ¡El cambio más importante está aquí!
    
    const login = async (userData, token) => {
        localStorage.setItem('AUTH_TOKEN', token);
        setUser(userData);
        // Sincronizamos la sesión con Firebase después de un nuevo login
        await reauthenticate(); 
        navigate('/dashboard');
    };

    const logout = async () => {
        // Cerramos ambas sesiones
        localStorage.removeItem('AUTH_TOKEN');
        setUser(null);
        await signOutFromFirebase();
        navigate('/login');
    };
    
    const value = { user, isAuthLoading, login, logout, reauthenticate };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};