// src/layouts/DashboardLayout.jsx

import { useState, useEffect } from 'react'; // ✅ CORRECCIÓN 1: Se importan los hooks
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Edit, LogOut, Menu, Home, PlusCircle, List, Settings, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsDropdown from '@/pages/dashboard/NotificationsDropDown';
import { SimpleTour } from '@/components/ui/SimpleTour';

const tourPasos = [
    {
        target: '#crear-ficha-link',
        content: 'Usa esta opción para registrar a una persona que estás buscando. Es el primer paso.',
    },
    {
        target: '#crear-hallazgo-link',
        content: 'Si has encontrado a alguien y quieres reportarlo para ayudar, haz clic aquí.',
    },
    {
        target: '#mis-fichas-link', // Apunta a este ID
        content: 'Aquí puedes ver y editar todas las fichas de búsqueda que has creado.',
    },
    {
        target: '#configuracion-link',
        content: 'Desde aquí puedes gestionar los datos de tu cuenta.',
    }
];

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [runTour, setRunTour] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenSidebarTour');
        if (!hasSeenTour) {
            setIsFirstVisit(true);
        }
    }, []);

    const startTour = () => {
        if (window.innerWidth < 768) {
            setIsSheetOpen(true);
        }
        setTimeout(() => {
            setRunTour(true);
            localStorage.setItem('hasSeenSidebarTour', 'true');
            setIsFirstVisit(false);
        }, 300);
    };

    const navLinks = [
        { to: "/dashboard", icon: Home, label: "Inicio", id: "inicio-link" },
        { to: "/dashboard/fichas/crear", icon: PlusCircle, label: "Crear Ficha", id: "crear-ficha-link" },
        // ✅ CORRECCIÓN 2: Se añade el ID que faltaba
        { to: "/dashboard/fichas", icon: Edit, label: "Ver Fichas", id: "mis-fichas-link" },
        { to: "/dashboard/hallazgos/crear", icon: PlusCircle, label: "Crear Hallazgo", id: "crear-hallazgo-link" },
        { to: "/dashboard/hallazgos", icon: List, label: "Ver Hallazgos", id: "ver-hallazgos-link" },
        { to: "/dashboard/mensajes", icon: MessageSquare, label: "Mensajes", id: "mensajes-link" },
        { to: "/dashboard/configuracion", icon: Settings, label: "Configuración", id: "configuracion-link" },
    ];

    const renderNavLinks = () => (
        <nav className="space-y-1 p-4 md:p-0">
            {navLinks.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    id={link.id}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                            isActive ? 'bg-gray-200 text-black font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                        }`
                    }
                    onClick={() => setIsSheetOpen(false)}
                >
                    <link.icon size={18} /> {link.label}
                </NavLink>
            ))}
            <div className="pt-4 md:hidden">
                <NotificationsDropdown />
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
            <SimpleTour
                run={runTour}
                steps={tourPasos}
                onComplete={() => setRunTour(false)}
            />

            <header className="flex justify-between items-center border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-4">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                <NotificationsDropdown />
                <Button variant="outline" onClick={logout} className="hidden md:flex gap-2 items-center">
                    <LogOut size={16} /> Cerrar sesión
                </Button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex flex-col w-56 border-r border-gray-200 bg-gray-50">
                    <div className="flex-grow p-4">
                        {renderNavLinks()}
                    </div>
                    <ReferenceNumberBlock />
                </aside>

                <main className="flex-1 p-4 bg-white overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={startTour}
                    className={`flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 ${isFirstVisit ? 'animate-pulse-button' : ''}`}
                    aria-label="Iniciar tour guiado"
                >
                    <HelpCircle size={28} />
                </button>
            </div>
        </div>
    );
};

export default DashboardLayout;