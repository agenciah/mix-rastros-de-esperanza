// RUTA: frontend/components/dashboard/HallazgosRecientesDashboard.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHallazgos } from '@/hooks/useHallazgos';
import { HallazgoDashboardCard } from './HallazgoDashboardCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export const HallazgosRecientesDashboard = () => {
    
    // 1. Usamos el hook pidiéndole que cargue los hallazgos del usuario al montarse.
    const { hallazgos, isLoading, error } = useHallazgos({ fetchOnMount: true });

    // 2. Tomamos solo los 5 más recientes para el carrusel.
    const hallazgosRecientes = hallazgos.slice(0, 5);

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Últimos Hallazgos que Reportaste</h2>
                <Button asChild variant="link"><Link to="/dashboard/hallazgos-list">Ver todos →</Link></Button>
            </div>

            {/* 3. Lógica de renderizado autocontenida */}
            {isLoading && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {!isLoading && !error && (
                hallazgosRecientes.length > 0 ? (
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {hallazgosRecientes.map((item) => (
                                <CarouselItem key={item.id_hallazgo} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3">
                                    <HallazgoDashboardCard hallazgo={item} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                    </Carousel>
                ) : ( <p className="text-gray-500">No has reportado hallazgos.</p> )
            )}
        </section>
    );
};