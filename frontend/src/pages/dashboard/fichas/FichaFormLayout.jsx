// RUTA: src/pages/dashboard/fichas/FichaFormLayout.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

// --- Hooks ---
import { useFichaForm } from '@/hooks/useFichaForm';
import { useFichas } from '@/hooks/useFichas';
import { initialFichaFormState } from '@/lib/initialFormState';

// --- Sub-componentes del Formulario ---
import RasgosFisicosForm from "./RasgosFisicosForm";
import VestimentaForm from "./VestimentaForm";
import DatosPrincipalesForm from "./DatosPrincipalesForm";

export default function FichaFormLayout() {
    const navigate = useNavigate();

    // --- Lógica de Verificación de Límite de Fichas ---
    const [activeFichasCount, setActiveFichasCount] = useState(0);
    const [loadingCheck, setLoadingCheck] = useState(true);
    const planLimit = 3; // Límite para el plan básico

    useEffect(() => {
        api.get('/api/fichas/user-stats')
           .then(res => setActiveFichasCount(res.data.data.activeFichasCount))
           .catch(err => console.error("Error al verificar límite de fichas:", err))
           .finally(() => setLoadingCheck(false));
    }, []);

    // --- Hooks de la Aplicación ---
    const { createFicha } = useFichas();
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
    } = useFichaForm(initialFichaFormState); // Se pasa el estado inicial para la creación

     const handleCreateSubmit = async (e) => {
        e.preventDefault();
        // ✅ AHORA LLAMA AL `handleSubmit` CORRECTO PASÁNDOLE `createFicha`
        const result = await handleSubmit(createFicha);
        if (result?.success) {
            navigate('/dashboard/fichas');
            toast.info('Buscando coincidencias en segundo plano...');
        }
    };

    const isLoading = loadingCheck || isSubmitting;

    // --- Renderizado Condicional ---

    if (loadingCheck) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Verificando tu cuenta...</span>
            </div>
        );
    }

    if (activeFichasCount >= planLimit) {
        return (
            <div className="max-w-lg mx-auto p-6">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="flex justify-center items-center">
                            <AlertCircle className="mr-2 text-yellow-500" />
                            Con la intención de evitar abusos, establecimos un limite de 3 fichas por usuario.
                        </CardTitle>
                        <CardDescription>
                            Por favor, considera que la plataforma se mantiene de las donaciones que los usuarios realizan. Esto nos permite ampliar el servicio que actualmente brindamos sin un costo fijo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-gray-700">
                            So requieres apoyo, por favor manda un correo a contacto@hastaencontrarte.lat y con gusto discutiremos tu caso.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button asChild variant="outline"><Link to="/dashboard/fichas">Gestionar Fichas</Link></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Guardia de seguridad por si el formData no se ha inicializado
    if (!formData) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Registro de Ficha de Búsqueda</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateSubmit} className="space-y-8">
                        <DatosPrincipalesForm
                            form={formData}
                            handleChange={handleChange}
                            handleNestedChange={handleNestedChange}
                            setImageFile={setImageFile}
                        />
                        <Separator />
                        <RasgosFisicosForm
                            rasgos={formData.rasgos_fisicos}
                            handleArrayChange={(index, field, value) => handleArrayChange('rasgos_fisicos', index, field, value)}
                            addArrayItem={() => addArrayItem('rasgos_fisicos', { id_parte_cuerpo: '', tipo_rasgo: '', descripcion_detalle: '' })}
                            removeArrayItem={(index) => removeArrayItem('rasgos_fisicos', index)}
                        />
                        <Separator />
                        <VestimentaForm
                            vestimenta={formData.vestimenta}
                            handleArrayChange={(index, field, value) => handleArrayChange('vestimenta', index, field, value)}
                            addArrayItem={() => addArrayItem('vestimenta', { id_prenda: '', color: '', marca: '', caracteristica_especial: '' })}
                            removeArrayItem={(index) => removeArrayItem('vestimenta', index)}
                        />
                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isSubmitting ? `Guardando... ${Math.round(uploadProgress)}%` : 'Verificando...'}
                                    </>
                                ) : (
                                    "Crear Ficha y Buscar Coincidencias"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}