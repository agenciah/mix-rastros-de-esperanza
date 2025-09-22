// RUTA: frontend/src/pages/auth/ConfirmarToken.jsx

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';

const ConfirmarToken = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token'); // ✅ Forma correcta de leer el token de la URL

    useEffect(() => {
        if (!token) {
            toast.error("Token de confirmación no encontrado.");
            navigate('/login');
            return;
        }

        const confirmarCuenta = async () => {
            try {
                // ✅ La petición ahora es GET, que es lo que el backend espera
                await api.get(`/auth/confirm?token=${token}`);
                toast.success('¡Cuenta confirmada con éxito! Ya puedes iniciar sesión.');
                navigate('/login');
            } catch (error) {
                toast.error(error.response?.data || 'Token inválido o expirado. Por favor, solicita un nuevo correo.');
                navigate('/login'); // O a una página de error específica
            }
        };

        confirmarCuenta();
    }, [token, navigate]);

    // Este componente es solo para lógica, no renderiza nada visible.
    return <div>Verificando tu cuenta...</div>;
};

export default ConfirmarToken;