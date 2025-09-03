// src/layouts/DashboardLayout.jsx

import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Edit, LogOut, Menu, Home, PlusCircle, List, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const DashboardLayout = () => {
    const { user, logout } = useAuth();

    const navLinks = [
        { to: "/dashboard", icon: Home, label: "Inicio" },
        { to: "/dashboard/fichas/crear", icon: PlusCircle, label: "Crear Ficha" },
        { to: "/dashboard/fichas", icon: Edit, label: "Ver Fichas" },
        { to: "/dashboard/hallazgos/crear", icon: PlusCircle, label: "Crear Hallazgo" },
        { to: "/dashboard/hallazgos", icon: List, label: "Ver Hallazgos" },
        { to: "/dashboard/mensajes", icon: MessageSquare, label: "Mensajes" }, // <-- Agrega esta línea
        { to: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
    ];

    const renderNavLinks = () => (
        <nav className="space-y-1 p-4 md:p-0">
            {navLinks.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                          isActive ? 'bg-gray-200 text-black font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                        }`
                    }
                >
                    <link.icon size={18} /> {link.label}
                </NavLink>
            ))}
            <div className="pt-4 md:hidden">
              <Button variant="outline" onClick={logout} className="w-full flex gap-2 items-center">
                <LogOut size={16} /> Cerrar sesión
              </Button>
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen w-full bg-white text-black flex flex-col">
            {/* Header superior */}
            <header className="flex justify-between items-center border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-4">
                    {/* Botón de menú para móvil */}
                    <Sheet>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 sm:max-w-xs">
                            <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
                                <div className="p-4 border-b">
                                    <h1 className="text-lg font-semibold">Menú</h1>
                                </div>
                                {renderNavLinks()}
                            </div>
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-lg font-semibold hidden md:block">
                        Bienvenido, <span className="text-gray-800">{user?.nombre || 'Usuario'}</span>
                    </h1>
                </div>
                {/* Botón de cerrar sesión para desktop */}
                <Button variant="outline" onClick={logout} className="hidden md:flex gap-2 items-center">
                    <LogOut size={16} /> Cerrar sesión
                </Button>
            </header>

            {/* Contenido (abarca Sidebar y Página activa) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar para desktop */}
                <aside className="hidden md:block w-56 border-r border-gray-200 bg-gray-50 p-4">
                    {renderNavLinks()}
                </aside>

                {/* Página activa */}
                <main className="flex-1 p-4 bg-white overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;