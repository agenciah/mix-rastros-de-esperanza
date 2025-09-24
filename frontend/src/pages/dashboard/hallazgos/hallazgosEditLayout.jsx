// RUTA: src/pages/dashboard/hallazgos/hallazgosEditLayout.jsx

import { useEffect } from 'react';
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Terminal, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';

// ✅ 1. IMPORTAMOS LOS HOOKS MAESTROS
import { useHallazgos } from "@/hooks/useHallazgos";
import { useFormHallazgos } from "@/hooks/hallazgos/useFormHallazgos";

// Sub-componentes
import HallazgoDatosPrincipales from "@/pages/dashboard/hallazgos/HallazgoDatosPrincipales";
import HallazgoCaracteristicas from "@/pages/dashboard/hallazgos/hallazgoCaracteristicas";
import HallazgoVestimenta from "@/pages/dashboard/hallazgos/hallazgoVestimenta";

export default function HallazgoEditLayout() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ✅ 2. USAMOS LA ARQUITECTURA DE HOOKS CORRECTA
    const { getHallazgoById, actualizarHallazgo, isLoading: isApiLoading, error: apiError } = useHallazgos();
    const {
        formData,
        setFormData,
        isSubmitting,
        uploadProgress,
        setImageFile, // <-- Ahora sí la obtenemos del hook correcto
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleSubmit,
    } = useFormHallazgos(null); // Empezamos con null para esperar los datos

    useEffect(() => {
        const fetchInitialData = async () => {
            if (id) {
                const data = await getHallazgoById(id);
                if (data) {
                    // ✅ INICIA CORRECCIÓN: Formateamos la fecha del hallazgo
                    if (data.fecha_hallazgo) {
                        try {
                            // Convertimos a YYYY-MM-DD para el input de fecha
                            data.fecha_hallazgo = new Date(data.fecha_hallazgo).toISOString().split('T')[0];
                        } catch (e) {
                            console.error("Error al formatear la fecha de hallazgo:", e);
                            data.fecha_hallazgo = ''; // Dejar en blanco si hay error
                        }
                    }
                    // ✅ FIN CORRECCIÓN
                    
                    setFormData(data);
                }
            }
        };
        fetchInitialData();
    }, [id, getHallazgoById, setFormData]);

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const updateAction = (payload) => actualizarHallazgo(id, payload);
        const result = await handleSubmit(updateAction);
        if (result?.success) {
            navigate('/dashboard/hallazgos');
        }
    };
    
    const isLoading = isApiLoading || isSubmitting;

    if (!formData) {
        if (isApiLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return <Alert variant="destructive" className="m-6"><AlertTitle>Error</AlertTitle><AlertDescription>{apiError || "No se pudo encontrar el hallazgo."}</AlertDescription></Alert>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Editar Hallazgo</h1>
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>1. Datos Principales y Foto</CardTitle></CardHeader>
                    <CardContent>
                        {/* ✅ 3. PASAMOS LA PROP `setImageFile` CORRECTAMENTE */}
                        <HallazgoDatosPrincipales
                            form={formData}
                            handleChange={handleChange}
                            handleNestedChange={handleNestedChange}
                            setImageFile={setImageFile}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>2. Características Físicas</CardTitle></CardHeader>
                    <CardContent>
                        <HallazgoCaracteristicas
                            caracteristicas={formData.caracteristicas || []}
                            handleArrayChange={(index, fieldName, value) => handleArrayChange('caracteristicas', index, fieldName, value)}
                            addArrayItem={() => addArrayItem('caracteristicas', { id_parte_cuerpo: '', tipo_caracteristica: '', descripcion: '' })}
                            removeArrayItem={(index) => removeArrayItem('caracteristicas', index)}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>3. Vestimenta</CardTitle></CardHeader>
                    <CardContent>
                        <HallazgoVestimenta
                            vestimenta={formData.vestimenta || []}
                            handleArrayChange={(index, fieldName, value) => handleArrayChange('vestimenta', index, fieldName, value)}
                            addArrayItem={() => addArrayItem('vestimenta', { id_prenda: '', color: '', marca: '', caracteristica_especial: '' })}
                            removeArrayItem={(index) => removeArrayItem('vestimenta', index)}
                        />
                    </CardContent>
                </Card>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isSubmitting ? `Guardando... ${Math.round(uploadProgress)}%` : 'Procesando...'} </> ) : ( "Guardar Cambios" )}
                </Button>
            </form>
        </div>
    );
}