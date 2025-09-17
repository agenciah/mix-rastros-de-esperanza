// RUTA: src/pages/dashboard/hallazgos/HallazgoDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Camera, User, MapPin, Calendar, Ruler, Weight, UserCircle, Edit, MessageSquare, Building } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ✅ 1. IMPORTAMOS NUESTRO HOOK MAESTRO
import { useHallazgos } from '@/hooks/useHallazgos';
import { useMessaging } from '@/hooks/useMessaging';

// Sub-componente para mostrar un detalle y no repetir código
const DetailItem = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm text-gray-700">
            <Icon className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
            <span>
                <span className="font-semibold">{label}:</span> {value}
            </span>
        </div>
    );
};

export default function HallazgoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getHallazgoById, isLoading, error } = useHallazgos();
    const { startConversation, isLoading: isStartingChat } = useMessaging();
    const [hallazgo, setHallazgo] = useState(null);

    useEffect(() => {
        const fetchHallazgo = async () => {
            const data = await getHallazgoById(id);
            if (data) setHallazgo(data);
        };
        fetchHallazgo();
    }, [id, getHallazgoById]);

    const handleStartConversation = async () => {
        if (!hallazgo?.id_usuario_buscador) return;
        const conversationId = await startConversation(hallazgo.id_usuario_buscador);
        if (conversationId) navigate(`/dashboard/mensajes/${conversationId}`);
    };

    if (isLoading && !hallazgo) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error || !hallazgo) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "No se pudo encontrar el hallazgo."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const nombreCompleto = [hallazgo.nombre, hallazgo.segundo_nombre, hallazgo.apellido_paterno, hallazgo.apellido_materno].filter(Boolean).join(' ');
    const ubicacionCompleta = [hallazgo.ubicacion_hallazgo?.calle, hallazgo.ubicacion_hallazgo?.localidad, hallazgo.ubicacion_hallazgo?.municipio, hallazgo.ubicacion_hallazgo?.estado].filter(Boolean).join(', ');

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la lista
            </Button>

            <Card>
                <CardHeader>
                    {/* ✅ 2. MOSTRAMOS LA FOTO DEL HALLAZGO */}
                    <div className="w-full h-72 rounded-lg bg-slate-200 mb-6 flex items-center justify-center overflow-hidden">
                        {hallazgo.foto_hallazgo ? (
                            <img src={hallazgo.foto_hallazgo} alt={`Foto de ${nombreCompleto}`} className="w-full h-full object-cover" />
                        ) : (
                            <Camera className="w-16 h-16 text-slate-400" />
                        )}
                    </div>
                    <CardTitle className="text-3xl font-bold">{nombreCompleto || 'Persona Sin Identificar'}</CardTitle>
                    <CardDescription>{hallazgo.descripcion_general_hallazgo}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* --- Columna Izquierda --- */}
                        <div className="space-y-4">
                            <h3 className="font-semibold border-b pb-1">Datos Físicos</h3>
                            <DetailItem icon={User} label="Género" value={hallazgo.genero} />
                            <DetailItem icon={Calendar} label="Edad estimada" value={hallazgo.edad_estimada ? `${hallazgo.edad_estimada} años` : null} />
                            <DetailItem icon={Ruler} label="Estatura" value={hallazgo.estatura ? `${hallazgo.estatura} cm` : null} />
                            <DetailItem icon={Weight} label="Peso" value={hallazgo.peso ? `${hallazgo.peso} kg` : null} />
                            <DetailItem icon={UserCircle} label="Complexión" value={hallazgo.complexion} />
                        </div>
                        {/* --- Columna Derecha --- */}
                        <div className="space-y-4">
                            <h3 className="font-semibold border-b pb-1">Detalles del Hallazgo</h3>
                            <DetailItem icon={MapPin} label="Ubicación" value={ubicacionCompleta} />
                            <DetailItem icon={Building} label="Tipo de lugar" value={hallazgo.tipo_lugar} />
                            <DetailItem icon={Calendar} label="Fecha del hallazgo" value={new Date(hallazgo.fecha_hallazgo).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} />
                        </div>
                    </div>
                    
                    {/* ✅ 3. MOSTRAMOS TODOS LOS DATOS (CARACTERÍSTICAS Y VESTIMENTA) */}
                    {(hallazgo.caracteristicas?.length > 0) && (
                        <div>
                            <h3 className="font-semibold border-b pb-1 mb-2">Características Particulares</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 pl-4">
                                {hallazgo.caracteristicas.map((c, i) => (
                                    <li key={i}>
                                        <strong>{c.nombre_parte || 'Rasgo'}:</strong> {`${c.tipo_caracteristica || ''} - ${c.descripcion || ''}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(hallazgo.vestimenta?.length > 0) && (
                        <div>
                            <h3 className="font-semibold border-b pb-1 mb-2">Vestimenta</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 pl-4">
                                {hallazgo.vestimenta.map((v, i) => (
                                    <li key={i}>
                                        <strong>{v.tipo_prenda || 'Prenda'}:</strong> {`${v.color || ''} ${v.marca || ''} ${v.caracteristica_especial || ''}`.trim()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <Button onClick={handleStartConversation} disabled={isStartingChat} className="w-full">
                        {isStartingChat ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                        Contactar a quien reportó
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}