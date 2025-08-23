import { useAuth } from '../context/AuthContext';
import { useRoutes, Navigate } from 'react-router-dom'; // Importa useRoutes

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
import ChatbotPlanInfo from '../pages/dashboard/ChatbotPlanInfo';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AdminLogin from '@/pages/admin/AdminLogin';

// Importa la configuración de rutas de administrador
import { adminRoutesConfig } from './adminRoutesConfig';

// Rutas privadas
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import Gastos from '../pages/dashboard/Gastos';
import ExportarExcel from '../pages/dashboard/ExportarExcel';
import Configuracion from '../pages/dashboard/Configuracion';
import Contacto from '@/pages/public/Contacto';

const RoutesApp = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-10">Cargando...</div>;

  // Define tus rutas como un array de objetos
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
    { path: "chatbot-info", element: <ChatbotPlanInfo /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/recuperar/:token", element: <ResetPassword /> },
    { path: "/admin/login", element: <AdminLogin /> },

    // Rutas de administrador (importadas)
    ...adminRoutesConfig, // Aquí se "desestructuran" las rutas del archivo de configuración

    // Rutas protegidas para usuarios normales
    {
      element: <ProtectedRoute />, // Este es el layout/componente de protección
      children: [ // Las rutas anidadas se definen en el array 'children'
        {
          path: "/dashboard",
          element: <DashboardLayout />, // Este es el layout del dashboard
          children: [
            { index: true, element: <Dashboard /> }, // Ruta index para /dashboard
            { path: "gastos", element: <Gastos /> },
            { path: "excel", element: <ExportarExcel /> },
            { path: "configuracion", element: <Configuracion /> },
            { path: 'chatbot-cta', element: <ChatbotPlanInfo/>},
          ],
        },
      ],
    },

    // Ruta comodín para manejar rutas no encontradas
    { path: "*", element: <Navigate to={user ? "/dashboard" : "/login"} /> },
  ];

  // useRoutes toma el array de objetos de ruta y devuelve el elemento React que debe renderizarse
  const element = useRoutes(allRoutes);

  return element; // Renderiza el elemento devuelto por useRoutes
};

export default RoutesApp;
