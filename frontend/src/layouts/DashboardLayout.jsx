import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Home,
  Wallet,
  FileSpreadsheet,
  Settings,
  User,
  Bot
} from 'lucide-react'


const DashboardLayout = () => {
  const { user, logout } = useAuth();

  return (
    // Contenedor principal: min-h-screen y w-full para ocupar toda la pantalla, sin colores de depuración.
    <div className="min-h-screen w-full h-screen bg-white text-black flex flex-col">

      {/* Header superior */}
      <header className="flex justify-between items-center border-b border-gray-200 p-4 bg-white"> {/* Restablecido p-4 para un padding estético */}
        <h1 className="text-lg font-semibold">
          Bienvenido, <span className="text-gray-800">{user?.nombre || 'Usuario'}</span>
        </h1>
        <Button variant="outline" onClick={logout} className="flex gap-2 items-center">
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </header>

      {/* Contenido (abarca Sidebar y Página activa) */}
      <div className="flex flex-1">
        {/* Sidebar */}
<aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
  <nav className="space-y-1">
    <NavLink
      to="/dashboard"
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md transition ${
          isActive
            ? 'bg-gray-200 text-black font-semibold'
            : 'text-gray-700 hover:bg-gray-100 hover:text-black'
        }`
      }
    >
      <Home size={18} /> Inicio
    </NavLink>
    <NavLink
              to="/dashboard/fichas"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                  isActive
                    ? 'bg-gray-200 text-black font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`
              }
            >
              <Wallet size={18} /> Crear Ficha
            </NavLink>

    
    <NavLink
      to="/dashboard/configuracion"
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md transition ${
          isActive
            ? 'bg-gray-200 text-black font-semibold'
            : 'text-gray-700 hover:bg-gray-100 hover:text-black'
        }`
      }
    >
      <Settings size={18} /> Configuración
    </NavLink>
  

  </nav>
</aside>

        {/* Página activa */}
        <main className="flex-1 p-4 bg-white"> {/* Sin colores de depuración. Restablecido p-4 para padding del contenido */}
          <Outlet />
        </main>
       
      </div>
    </div>  
  );
};

export default DashboardLayout;