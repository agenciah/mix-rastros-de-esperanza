// adminRoutesConfig.js
import React from 'react'; // Importa React si usas JSX directamente en los elementos
import { Route } from 'react-router-dom'; // No necesitas Route aquí si solo exportas objetos

import DashboardLayoutAdmin from "../layouts/DashboardLayoutAdmin";
import DashboardGeneral from "../pages/admin/DashboardGeneral";
import UsuariosPage from "../pages/admin/UsuariosPage";
import Configuracion from "../pages/admin/Configuracion";
import Historial from "../pages/admin/Historial";
import AdminFichasPage from '@/pages/admin/fichas/AdminFichasPages';
import AdminHallazgosPage from '@/pages/admin/hallazgos/AdminHallazgosPape';
import AdminMatchesDashboard from '@/pages/admin/AdminMatchesDashboard';
import GestionPagos from '@/pages/admin/GestionPagos';

// Exportamos un array de objetos de ruta
export const adminRoutesConfig = [
  {
    path: "/admin",
    element: <DashboardLayoutAdmin />, // Aquí usas el componente de layout
    children: [
      { index: true, element: <DashboardGeneral /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "fichas", element: <AdminFichasPage /> },
      { path: "hallazgos", element: <AdminHallazgosPage /> },
      { path: "matches", element: <AdminMatchesDashboard /> },
      { path: "gestion-pagos", element: <GestionPagos /> },
      { path: "configuracion", element: <Configuracion /> },
      { path: "historial", element: <Historial /> },
    ],
  },
];