// RUTA: frontend/src/hooks/useFirebaseAuth.js
import { useState, useEffect } from 'react';
import app from '@/lib/firebase';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { toast } from 'sonner';

const auth = getAuth(app);

export const useFirebaseAuth = () => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("useFirebaseAuth: onAuthStateChanged se disparó. Usuario:", user ? user.uid : 'null');
            setFirebaseUser(user);
            setIsFirebaseAuthenticated(!!user);
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signIn = async (firebaseToken) => {
        try {
            console.log("useFirebaseAuth: Intentando signInWithCustomToken...");
            const userCredential = await signInWithCustomToken(auth, firebaseToken);
            console.log("✅ useFirebaseAuth: signInWithCustomToken exitoso.");
            return userCredential.user;
        } catch (error) {
            console.error("❌ useFirebaseAuth: signInWithCustomToken falló.", error);
            toast.error("Error al conectar con los servicios de la aplicación.");
            throw error;
        }
    };

    const logOut = async () => {
        try {
            await signOut(auth);
            console.log("useFirebaseAuth: Sesión de Firebase cerrada.");
        } catch (error) {
            console.error("❌ useFirebaseAuth: Error al cerrar sesión de Firebase.", error);
        }
    };

    return { firebaseUser, isFirebaseAuthenticated, isAuthLoading, signIn, logOut };
};