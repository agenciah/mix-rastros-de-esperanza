import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HallazgoDatosPrincipales from "@/pages/dashboard/hallazgos/hallazgoDatosPrincipales";
import HallazgoCaracteristicas from "@/pages/dashboard/hallazgos/hallazgoCaracteristicas";
import HallazgoVestimenta from "@/pages/dashboard/hallazgos/hallazgoVestimenta";

import { useHallazgos } from "@/hooks/hallazgos/useHallazgosHook";
import { useFormHallazgos } from "@/hooks/hallazgos/useFormHallazgos";
import { useAuth } from '@/context/AuthContext';

export default function HallazgoEditLayout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const initialState = {
    nombre: '',
    // ... otros campos
    ubicacion_hallazgo: {
        estado: '',
        municipio: ''
    },
    caracteristicas: [],
    vestimenta: [],
};
    
    const { 
        getHallazgoById, 
        actualizarHallazgo, 
        isLoading, 
        error 
    } = useHallazgos();

    const {
        formData,
        setFormData,
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
    } = useFormHallazgos({});

    // 1. Hook para cargar los datos del hallazgo
    useEffect(() => {
        const fetchHallazgoData = async () => {
            if (id) {
                const data = await getHallazgoById(id);
                if (data) {
                    // Aquí la magia ocurre:
                    // Si el backend ya tiene el formato correcto, esto funcionará:
                    setFormData(data);
                }
            }
        };
        fetchHallazgoData();
    }, [id, getHallazgoById, setFormData]);

    // 2. Manejador para el envío del formulario de edición
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (authLoading || !user) {
            console.error("Error: Usuario no autenticado o no disponible. Intente de nuevo.");
            return;
        }

        const hallazgoDataToSend = {
            ...formData,
            id_usuario_buscador: user.id, // Se usa user.id, corregido para consistencia
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
            const result = await actualizarHallazgo(id, hallazgoDataToSend);
            if (result) {
                navigate('/dashboard/hallazgos');
            }
        } catch (err) {
            console.error("Error al actualizar hallazgo:", err);
        }
    }, [formData, user, actualizarHallazgo, id, navigate, authLoading]);

    // Estados de carga y error
    if (isLoading || authLoading) {
        return <div className="text-center p-8">Cargando detalles del hallazgo...</div>;
    }
    
    // Si el usuario no está autenticado después de cargar
    if (!user) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error de Autenticación</AlertTitle>
          <AlertDescription>No se pudo cargar la información del usuario. Intenta recargar la página.</AlertDescription>
        </Alert>
      )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    // Si el formulario aún no tiene datos, no lo renderizamos
    if (Object.keys(formData).length === 0) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Editar Hallazgo</h1>
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
                
                {error && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                >
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </form>
        </div>
    );
}