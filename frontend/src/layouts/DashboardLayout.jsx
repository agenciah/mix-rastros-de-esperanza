// src/layouts/DashboardLayout.jsx

import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Edit, LogOut, Menu, Home, PlusCircle, List, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsDropdown from '@/pages/dashboard/NotificationsDropDown';

const DashboardLayout = () => {
    const { user, logout } = useAuth();

    const navLinks = [
        { to: "/dashboard", icon: Home, label: "Inicio" },
        { to: "/dashboard/fichas/crear", icon: PlusCircle, label: "Crear Ficha" },
        { to: "/dashboard/fichas", icon: Edit, label: "Ver Fichas" },
        { to: "/dashboard/hallazgos/crear", icon: PlusCircle, label: "Crear Hallazgo" },
        { to: "/dashboard/hallazgos", icon: List, label: "Ver Hallazgos" },
        { to: "/dashboard/mensajes", icon: MessageSquare, label: "Mensajes" },
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
                <NotificationsDropdown/>
                <Button variant="outline" onClick={logout} className="w-full flex gap-2 items-center">
                    <LogOut size={16} /> Cerrar sesión
                </Button>
            </div>
        </nav>
    );

    const ReferenceNumberBlock = () => (
        <div className="mt-auto p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Tu Número de Referencia:</p>
            <p className="text-lg font-bold text-gray-800 tracking-wider text-center py-1 bg-gray-100 rounded">
                {user?.numero_referencia_unico}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-white text-black flex flex-col">
            {/* Header superior */}
            <header className="flex justify-between items-center border-b border-gray-200 p-4 bg-white">
                {/* --- INICIO: SECCIÓN RESTAURADA DEL HEADER --- */}
                <div className="flex items-center gap-4">
                    {/* Botón de menú para móvil (se mantiene dentro del header) */}
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
                                <div className="flex-grow">
                                    {renderNavLinks()}
                                </div>
                                <ReferenceNumberBlock />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-lg font-semibold hidden md:block">
                        Bienvenido, <span className="text-gray-800">{user?.nombre || 'Usuario'}</span>
                    </h1>
                </div>
                <NotificationsDropdown/>
                {/* Botón de cerrar sesión para desktop */}
                <Button variant="outline" onClick={logout} className="hidden md:flex gap-2 items-center">
                    <LogOut size={16} /> Cerrar sesión
                </Button>
                {/* --- FIN: SECCIÓN RESTAURADA DEL HEADER --- */}
            </header>

            {/* Contenido (abarca Sidebar y Página activa) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar para desktop */}
                <aside className="hidden md:flex flex-col w-56 border-r border-gray-200 bg-gray-50">
                    <div className="flex-grow p-4">
                        {renderNavLinks()}
                    </div>
                    <ReferenceNumberBlock />
                </aside>
                
                {/* Ya no necesitamos el menú de móvil aquí, porque está en el header */}

                {/* Página activa */}
                <main className="flex-1 p-4 bg-white overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;