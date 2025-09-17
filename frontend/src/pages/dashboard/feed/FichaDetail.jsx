// RUTA: src/pages/dashboard/feed/FichaDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Camera, User, MapPin, Calendar, Ruler, Weight, UserCircle, MessageSquare, Building, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/context/AuthContext'; // Para saber si el usuario actual es el creador

// ✅ 1. IMPORTAMOS NUESTROS HOOKS MAESTROS
import { useFichas } from '@/hooks/useFichas';
import { useMessaging } from '@/hooks/useMessaging';

// Sub-componente reutilizable
const DetailItem = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm text-gray-700">
            <Icon className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
            <span><span className="font-semibold">{label}:</span> {value}</span>
        </div>
    );
};


const FichaDetail = () => {
     const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Obtenemos el usuario logueado
    const { getFichaById, isLoading, error } = useFichas();
    const { startConversation, isLoading: isStartingChat } = useMessaging();
    const [ficha, setFicha] = useState(null);

    useEffect(() => {
        if (id) {
            const fetchFicha = async () => {
                const data = await getFichaById(id);
                setFicha(data);
            };
            fetchFicha();
        }
    }, [id, getFichaById]);

    const handleStartConversation = async () => {
        if (!ficha?.id_usuario_creador) return;
        const conversationId = await startConversation(ficha.id_usuario_creador);
        if (conversationId) navigate(`/dashboard/mensajes/${conversationId}`);
    };

    if (!ficha) {
         return isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : <div>Ficha no encontrada.</div>;
    }

    const nombreCompleto = [ficha.nombre, ficha.segundo_nombre, ficha.apellido_paterno, ficha.apellido_materno].filter(Boolean).join(' ');
    const ubicacionCompleta = [ficha.ubicacion_desaparicion?.municipio, ficha.ubicacion_desaparicion?.estado].filter(Boolean).join(', ');
    const isOwner = user?.id === ficha.id_usuario_cread


    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="self-start"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>

            <Card>
                <CardHeader>
                    <div className="w-full h-72 rounded-lg bg-slate-200 mb-6 flex items-center justify-center overflow-hidden">
                        {ficha.foto_perfil ? <img src={ficha.foto_perfil} alt={`Foto de ${nombreCompleto}`} className="w-full h-full object-cover" /> : <Camera className="w-16 h-16 text-slate-400" />}
                    </div>
                    <CardTitle className="text-3xl font-bold">{nombreCompleto}</CardTitle>
                    <CardDescription className="text-lg text-red-600 font-semibold">PERSONA DESAPARECIDA</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold border-b pb-1">Datos Físicos</h3>
                            <DetailItem icon={User} label="Género" value={ficha.genero} />
                            <DetailItem icon={Calendar} label="Edad estimada" value={ficha.edad_estimada ? `${ficha.edad_estimada} años` : null} />
                            <DetailItem icon={Ruler} label="Estatura" value={ficha.estatura ? `${ficha.estatura} cm` : null} />
                            <DetailItem icon={Weight} label="Peso" value={ficha.peso ? `${ficha.peso} kg` : null} />
                            <DetailItem icon={UserCircle} label="Complexión" value={ficha.complexion} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold border-b pb-1">Detalles de la Desaparición</h3>
                            <DetailItem icon={MapPin} label="Ubicación" value={ubicacionCompleta} />
                            <DetailItem icon={Building} label="Tipo de lugar" value={ficha.tipo_lugar} />
                            <DetailItem icon={Calendar} label="Fecha" value={new Date(ficha.fecha_desaparicion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} />
                        </div>
                    </div>
                    
                    {/* ✅ 2. CORRECCIÓN: MOSTRAMOS TODOS LOS DATOS */}
                    {(ficha.rasgos_fisicos?.length > 0) && (
                        <div>
                            <h3 className="font-semibold border-b pb-1 mb-2">Rasgos Particulares</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 pl-4">
                                {ficha.rasgos_fisicos.map((rasgo, i) => (
                                    <li key={i}><strong>{rasgo.nombre_parte || 'Rasgo'}:</strong> {rasgo.descripcion_detalle || 'Sin descripción.'}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(ficha.vestimenta?.length > 0) && (
                        <div>
                            <h3 className="font-semibold border-b pb-1 mb-2">Vestimenta</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 pl-4">
                                {ficha.vestimenta.map((prenda, i) => (
                                    <li key={i}><strong>{prenda.tipo_prenda || 'Prenda'}:</strong> {`${prenda.color || ''} ${prenda.marca || ''}`.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                <CardContent>
                    {isOwner ? (
                        <Button asChild className="w-full"><Link to={`/dashboard/fichas/editar/${ficha.id_ficha}`}><Edit className="mr-2 h-4 w-4" /> Editar mi Ficha</Link></Button>
                    ) : (
                        <Button onClick={handleStartConversation} disabled={isStartingChat} className="w-full">
                            {isStartingChat ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                            Contactar a quien publicó
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FichaDetail;