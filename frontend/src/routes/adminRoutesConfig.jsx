// adminRoutesConfig.js
import React from 'react'; // Importa React si usas JSX directamente en los elementos
import { Route } from 'react-router-dom'; // No necesitas Route aquí si solo exportas objetos

import DashboardLayoutAdmin from "../layouts/DashboardLayoutAdmin";
import DashboardGeneral from "../pages/admin/DashboardGeneral";
import TicketsPendientes from "../pages/admin/FacturasTicketsAdmin";
import ServicioPendiente from "../pages/admin/ServicioPendiente";
import UsuariosPage from "../pages/admin/UsuariosPage";
import Estadisticas from "../pages/admin/Estadisticas";
import Configuracion from "../pages/admin/Configuracion";
import Historial from "../pages/admin/Historial";

// Exportamos un array de objetos de ruta
export const adminRoutesConfig = [
  {
    path: "/admin",
    element: <DashboardLayoutAdmin />, // Aquí usas el componente de layout
    children: [
      { index: true, element: <DashboardGeneral /> },
      { path: "tickets", element: <TicketsPendientes /> },
      { path: "servicios", element: <ServicioPendiente /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "estadisticas", element: <Estadisticas /> },
      { path: "configuracion", element: <Configuracion /> },
      { path: "historial", element: <Historial /> },
    ],
  },
];