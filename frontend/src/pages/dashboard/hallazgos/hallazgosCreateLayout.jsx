import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HallazgoDatosPrincipales from "@/pages/dashboard/hallazgos/hallazgoDatosPrincipales";
import HallazgoVestimenta from "@/pages/dashboard/hallazgos/hallazgoVestimenta";
import HallazgoCaracteristicas from "@/pages/dashboard/hallazgos/hallazgoCaracteristicas";

// Importa los hooks para la lógica
import { useFormHallazgos } from "@/hooks/hallazgos/useFormHallazgos";
import { useHallazgos } from "@/hooks/hallazgos/useHallazgosHook";
import { useAuth } from '@/context/AuthContext';

const INITIAL_FORM_STATE = {
    nombre: "",
    segundo_nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_hallazgo: "",
    descripcion_general_hallazgo: "",
    id_tipo_lugar_hallazgo: null, // Asumimos que es un ID numérico
    ubicacion_hallazgo: {
        estado: "",
        municipio: "",
    },
    caracteristicas: [],
    vestimenta: [],
};

export default function HallazgoCreateLayout() {
    const navigate = useNavigate();
    // Obtiene el usuario y el estado de carga del contexto de autenticación
    const { user, loading: authLoading } = useAuth();
    
    // Usa el hook universal de formularios para manejar el estado
    const {
        formData,
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
    } = useFormHallazgos(INITIAL_FORM_STATE);

    // Usa el hook de la API para las acciones de creación
    const {
        createHallazgo,
        isLoading: formLoading,
        error: formError,
    } = useHallazgos();
    
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Obtener el ID del usuario del contexto
        const idUsuario = user?.id ?? null;

        console.log("👤 user en handleSubmit:", user);
        console.log("🆔 idUsuario calculado:", idUsuario);

        if (authLoading || !user || !idUsuario) {
            console.error("Error: Usuario no autenticado o no disponible. Intente de nuevo.");
            return;
        }

        const hallazgoDataToSend = {
            ...formData,
            id_usuario_buscador: idUsuario,
            // Aseguramos que los arrays anidados tengan los campos correctos para el backend
            caracteristicas: formData.caracteristicas.map(car => ({
                id_parte_cuerpo: parseInt(car.id_parte_cuerpo),
                tipo_caracteristica: car.tipo_caracteristica,
                descripcion: car.descripcion,
            })),
            vestimenta: formData.vestimenta.map(prenda => ({
                id_prenda: parseInt(prenda.id_prenda),
                color: prenda.color,
                marca: prenda.marca,
                caracteristica_especial: prenda.caracteristica_especial,
            })),
        };

        console.log("✈️ Datos enviados al backend:", hallazgoDataToSend);

        try {
            const result = await createHallazgo(hallazgoDataToSend);
            if (result) {
                navigate('/dashboard/hallazgos');
            }
        } catch (err) {
            console.error("Error al crear hallazgo:", err);
        }
    }, [formData, user, authLoading, createHallazgo, navigate]);

    // Muestra un estado de carga mientras los datos de auth se cargan
    if (authLoading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Crear Nuevo Hallazgo</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <Card>
                    <CardHeader>
                        <CardTitle>1. Datos Principales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HallazgoDatosPrincipales
                            form={formData}
                            handleChange={handleChange}
                            handleNestedChange={handleNestedChange}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Rasgos Físicos del Hallazgo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HallazgoCaracteristicas
                            caracteristicas={formData.caracteristicas}
                            handleArrayChange={(index, fieldName, value) => handleArrayChange('caracteristicas', index, fieldName, value)}
                            addArrayItem={(newItem) => addArrayItem('caracteristicas', newItem)}
                            removeArrayItem={(index) => removeArrayItem('caracteristicas', index)}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Vestimenta del Hallazgo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HallazgoVestimenta
                            vestimenta={formData.vestimenta}
                            handleArrayChange={(index, fieldName, value) => handleArrayChange('vestimenta', index, fieldName, value)}
                            addArrayItem={(newItem) => addArrayItem('vestimenta', newItem)}
                            removeArrayItem={(index) => removeArrayItem('vestimenta', index)}
                        />
                    </CardContent>
                </Card>
                
                {formError && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}
                
                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={formLoading || authLoading}
                >
                    {formLoading ? "Creando..." : "Crear Hallazgo"}
                </Button>
            </form>
        </div>
    );
}