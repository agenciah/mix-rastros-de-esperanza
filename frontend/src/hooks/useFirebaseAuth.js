// RUTA: frontend/hooks/useFirebaseAuth.js

import { useState, useEffect } from 'react';
import app from '@/lib/firebase'; // Asegúrate que esta es la ruta a tu config de Firebase
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { toast } from 'sonner';

const auth = getAuth(app);

export const useFirebaseAuth = () => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            setIsAuthLoading(false);
        });
        return () => unsubscribe(); // Limpieza al desmontar
    }, []);

    const signInToFirebase = async (firebaseToken) => {
        try {
            await signInWithCustomToken(auth, firebaseToken);
        } catch (error) {
            console.error("❌ Error al iniciar sesión en Firebase:", error);
            toast.error("Error al conectar con los servicios de la aplicación.");
            throw error;
        }
    };

    const signOutFromFirebase = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("❌ Error al cerrar sesión de Firebase:", error);
        }
    };

    return { firebaseUser, isAuthLoading, signInToFirebase, signOutFromFirebase };
};