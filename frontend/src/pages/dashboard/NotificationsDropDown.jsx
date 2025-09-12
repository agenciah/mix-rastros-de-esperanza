// RUTA: frontend/components/NotificationsDropdown.jsx

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NotificationsDropdown = () => {
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    Notificaciones
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto p-1" onClick={markAllAsRead}>
                            <CheckCheck className="mr-1 h-4 w-4" /> Marcar como leídas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <DropdownMenuItem key={notif.id_notificacion} asChild>
                            <Link to={notif.url_destino} className={`w-full flex items-start p-2 ${notif.estado === 'no_leido' ? 'font-semibold' : ''}`}>
                                {notif.estado === 'no_leido' && <span className="h-2 w-2 rounded-full bg-blue-500 mr-3 mt-1.5 flex-shrink-0"></span>}
                                <p className={`text-sm ${notif.estado === 'no_leido' ? '' : 'pl-5'}`}>
                                    {notif.contenido}
                                </p>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-sm text-center text-gray-500">No hay notificaciones.</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationsDropdown;