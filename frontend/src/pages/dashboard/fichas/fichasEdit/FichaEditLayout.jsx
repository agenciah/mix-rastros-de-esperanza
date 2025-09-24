// RUTA: src/pages/dashboard/fichas/fichasEdit/FichaEditLayout.jsx

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Lightbulb, Loader2 } from "lucide-react"; // Añadido Loader2

// ✅ 1. IMPORTACIONES CORRECTAS Y UNIFICADAS
import { useFichas } from "@/hooks/useFichas";
import { useFichaForm } from "@/hooks/useFichaForm"; // ¡Ahora con llaves y usando el alias @!

// Sub-componentes
import RasgosFisicosForm from "../RasgosFisicosForm";
import VestimentaForm from "../VestimentaForm";
import DatosPrincipalesForm from "../DatosPrincipalesForm";
import { toast } from "sonner";


export default function FichaEditLayout() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ✅ 2. ARQUITECTURA DE HOOKS LIMPIA
    const { getFichaById, updateFicha, isLoading: isApiLoading, error: apiError } = useFichas();
    const {
        formData,
        setFormData,
        isSubmitting,
        uploadProgress,
        setImageFile,
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleSubmit,
    } = useFichaForm(null); // Empezamos con null para esperar los datos

    // Carga de datos iniciales
    useEffect(() => {
        const fetchInitialData = async () => {
            if (id) {
                const data = await getFichaById(id);
                if (data) {
                    // ✅ INICIA CORRECCIÓN: Formateamos la fecha antes de pasarla al formulario
                    if (data.fecha_desaparicion) {
                        try {
                            // Convertimos la fecha a formato YYYY-MM-DD que el input[type=date] entiende
                            data.fecha_desaparicion = new Date(data.fecha_desaparicion).toISOString().split('T')[0];
                        } catch (e) {
                            console.error("Error al formatear la fecha de desaparición:", e);
                            data.fecha_desaparicion = ''; // Dejar en blanco si hay error
                        }
                    }
                    // ✅ FIN CORRECCIÓN

                    setFormData(data);
                }
            }
        };
        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, getFichaById, setFormData]);

    // Lógica de envío
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const updateAction = (payload) => updateFicha(id, payload);
        const result = await handleSubmit(updateAction);
        if (result?.success) {
            navigate('/dashboard/fichas');
        }
    };

    const isLoading = isApiLoading || isSubmitting;

    // Renderizado Condicional
    if (!formData) {
        if (isApiLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return (
            <Alert variant="destructive" className="m-6">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error al Cargar</AlertTitle>
                <AlertDescription>{apiError || "No se pudo encontrar la ficha."}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Edición de Ficha: {formData.nombre} {formData.apellido_paterno}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateSubmit} className="space-y-8">
                        <DatosPrincipalesForm
                            form={formData}
                            handleChange={handleChange}
                            handleNestedChange={handleNestedChange}
                            setImageFile={setImageFile}
                        />
                        <Separator />
                        <RasgosFisicosForm
                            rasgos={formData.rasgos_fisicos || []}
                            handleArrayChange={(index, field, value) => handleArrayChange('rasgos_fisicos', index, field, value)}
                            addArrayItem={() => addArrayItem('rasgos_fisicos', { id_parte_cuerpo: '', tipo_rasgo: '', descripcion_detalle: '' })}
                            removeArrayItem={(index) => removeArrayItem('rasgos_fisicos', index)}
                        />
                        <Separator />
                        <VestimentaForm
                            vestimenta={formData.vestimenta || []}
                            handleArrayChange={(index, field, value) => handleArrayChange('vestimenta', index, field, value)}
                            addArrayItem={() => addArrayItem('vestimenta', { id_prenda: '', color: '', marca: '', caracteristica_especial: '' })}
                            removeArrayItem={(index) => removeArrayItem('vestimenta', index)}
                        />
                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {`Guardando... ${Math.round(uploadProgress)}%`}
                                    </>
                                ) : "Guardar Cambios"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}