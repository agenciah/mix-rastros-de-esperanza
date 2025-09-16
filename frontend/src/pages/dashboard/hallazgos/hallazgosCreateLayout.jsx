// RUTA: src/pages/dashboard/hallazgos/hallazgosCreateLayout.jsx

import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

// ✅ 1. Importaciones correctas y finales
import { useHallazgos } from "@/hooks/useHallazgos";
import { useHallazgosForm } from "@/hooks/useFormHallazgos";
import { initialHallazgoFormState } from '@/lib/initialFormState';

// Sub-componentes
import HallazgoDatosPrincipales from "./HallazgoDatosPrincipales";
import HallazgoCaracteristicas from "./HallazgoCaracteristicas";
import HallazgoVestimenta from "./HallazgoVestimenta";

export default function HallazgosCreateLayout() {
    const navigate = useNavigate();
    
    // ✅ 2. Desestructuración limpia y con renombramiento claro
    // El hook de datos nos da la función de la API y su estado de carga
    const { createHallazgo, isLoading: isApiLoading } = useHallazgos();
    // El hook de formulario maneja el estado del form y la subida de la imagen
    const {
        formData,
        isSubmitting,
        uploadProgress,
        setImageFile,
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleSubmit,
    } = useHallazgosForm(initialHallazgoFormState);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const result = await handleSubmit(createHallazgo);
        if (result?.success) {
            navigate('/dashboard/hallazgos');
            toast.info('Buscando coincidencias en segundo plano...');
        }
    };

    // ✅ 3. Usamos los nombres correctos para el estado de carga combinado
    const isLoading = isSubmitting || isApiLoading;
    
    if (!formData) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-bold">Reportar Nuevo Hallazgo</h1>
            
            <form onSubmit={handleCreateSubmit} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>1. Datos Principales y Foto</CardTitle></CardHeader>
                    <CardContent>
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
                            handleArrayChange={(index, field, value) => handleArrayChange('caracteristicas', index, field, value)}
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
                            handleArrayChange={(index, field, value) => handleArrayChange('vestimenta', index, field, value)}
                            addArrayItem={() => addArrayItem('vestimenta', { id_prenda: '', color: '', marca: '', caracteristica_especial: '' })}
                            removeArrayItem={(index) => removeArrayItem('vestimenta', index)}
                        />
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="animate-spin mr-2" />}
                    {isSubmitting ? `Subiendo... ${Math.round(uploadProgress)}%` : 'Crear Hallazgo'}
                </Button>
            </form>
        </div>
    );
}