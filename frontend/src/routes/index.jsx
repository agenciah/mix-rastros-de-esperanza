import { useAuth } from '../context/AuthContext';
import { useRoutes, Navigate } from 'react-router-dom';

// Rutas públicas
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import PlanSelector from '@/pages/components/landing/PlanSelectorLanding';
import RegistroFacturacion from '@/pages/registro/RegistroFacturacion';
import LandingPage from '../pages/public/LandingPage';
import Footer from '@/pages/components/landing/Footer';
import AvisoPrivacidad from '@/pages/public/AvisoPrivacidad';
import TerminosCondiciones from '@/pages/public/Terminos';
import CorreoEnviado from '@/pages/auth/correoEnviado';
import ErrorToken from '@/pages/components/landing/errorToken';
import ConfirmarToken from '@/pages/components/landing/ConfirmarToken';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AdminLogin from '@/pages/admin/AdminLogin';

// Rutas de administrador
import { adminRoutesConfig } from './adminRoutesConfig';

// Rutas privadas y componentes del dashboard
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import FichaFormLayout from '@/pages/dashboard/fichas/FichaFormLayout';
import Configuracion from '../pages/dashboard/Configuracion';
import Contacto from '@/pages/public/Contacto';
import FichasList from '@/pages/dashboard/fichas/fichasEdit/FichasList';
import FichaEditLayout from '@/pages/dashboard/fichas/fichasEdit/FichaEditLayout';
import HallazgoCreateLayout from '@/pages/dashboard/hallazgos/hallazgosCreateLayout';
import HallazgoEditLayout from '@/pages/dashboard/hallazgos/hallazgosEditLayout';
import HallazgosList from '@/pages/dashboard/hallazgos/hallazgosList';
import FeedHallazgosList from '@/pages/dashboard/feed/feedHallazgosList';
import HallazgoDetail from '@/pages/dashboard/hallazgos/HallazgoDetail';
import Mensajes from '@/pages/dashboard/Mensajes';


const RoutesApp = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-10">Cargando...</div>;

  const allRoutes = [
    // Rutas públicas
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: !user ? <Login /> : <Navigate to="/dashboard" /> },
    { path: "/register", element: !user ? <Register /> : <Navigate to="/dashboard" /> },
    { path: "/registro-facturacion", element: <RegistroFacturacion /> },
    { path: "/Footer", element: <Footer/>},
    { path: '/aviso-privacidad', element: <AvisoPrivacidad/> },
    { path: 'terminos-condiciones', element: <TerminosCondiciones/> },
    { path: '/contacto', element: <Contacto/> },
    { path: "/correo-enviado", element: <CorreoEnviado /> },
    { path: '/error-token', element: <ErrorToken/>},
    { path: "/confirmar/:token", element: <ConfirmarToken /> },
    { path: '/seleccionar-plan', element: <PlanSelector/>},
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/recuperar/:token", element: <ResetPassword /> },
    { path: "/admin/login", element: <AdminLogin /> },

    // Rutas de administrador (importadas)
    ...adminRoutesConfig,

    // Rutas protegidas para usuarios normales
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/dashboard",
          element: <DashboardLayout />,
          children: [
            { index: true, element: <Dashboard /> },
            { path: "fichas", element: <FichasList/>},
            { path: "fichas/crear", element: <FichaFormLayout /> },
            { path: "fichas/editar/:id", element: <FichaEditLayout /> },
            { path: "hallazgos", element: <HallazgosList /> },
            { path: "hallazgos/crear", element: <HallazgoCreateLayout /> },
            { path: "hallazgos/editar/:id", element: <HallazgoEditLayout /> },
            { path: "configuracion", element: <Configuracion /> },
            { path: "mensajes", element: <Mensajes /> }, // <-- Agrega esta línea
            
            // Rutas del feed de hallazgos
            { path: "hallazgos-list", element: <FeedHallazgosList /> },
            { path: "hallazgos-list/:id", element: <HallazgoDetail /> },
          ],
        },
      ],
    },

    // Ruta comodín para manejar rutas no encontradas
    { path: "*", element: <Navigate to={user ? "/dashboard" : "/login"} /> },
  ];

  const element = useRoutes(allRoutes);

  return element;
};

export default RoutesApp;