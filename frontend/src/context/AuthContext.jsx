// /context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// ✨ 1. CREAMOS UNA FUNCIÓN AUXILIAR PARA NORMALIZAR LOS DATOS
// Esta función se asegura de que la propiedad 'plan' siempre sea un array.
const normalizeUserData = (userData) => {
  if (userData && typeof userData.plan === 'string') {
    try {
      // Intenta convertir el string del plan a un objeto/array real
      return { ...userData, plan: JSON.parse(userData.plan) };
    } catch (error) {
      console.error('⚠️ Error al parsear `user.plan`, se dejará como está:', error);
      // Si falla el parseo, devuelve los datos originales para no romper la app
      return userData;
    }
  }
  // Si no hay nada que hacer, devuelve los datos tal cual
  return userData;
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // <- Es mejor iniciar como null
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('user');

    if (userDataFromStorage) {
      const parsedData = JSON.parse(userDataFromStorage);
      // ✨ 2. USAMOS LA FUNCIÓN DE NORMALIZACIÓN AQUÍ
      const normalizedUser = normalizeUserData(parsedData);
      console.log('1. 🕵️‍♂️ AuthContext: Datos normalizados desde localStorage', normalizedUser);
      setUser(normalizedUser);
    }
    
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // ✨ 3. USAMOS LA NORMALIZACIÓN TAMBIÉN EN EL LOGIN
    const normalizedUser = normalizeUserData(userData);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser)); // Guardamos el usuario ya normalizado
    setUser(normalizedUser);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);