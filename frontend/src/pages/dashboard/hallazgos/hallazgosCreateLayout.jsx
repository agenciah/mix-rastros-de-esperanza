// src/pages/dashboard/hallazgos/HallazgoCreateLayout.jsx

import { useNavigate } from 'react-router-dom';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HallazgoDatosPrincipales from "@/pages/dashboard/hallazgos/hallazgoDatosPrincipales";
import HallazgoVestimenta from "@/pages/dashboard/hallazgos/hallazgoVestimenta";
import HallazgoCaracteristicas from "@/pages/dashboard/hallazgos/hallazgoCaracteristicas";

// Importa los hooks para la lógica
import useHallazgosForm from "@/hooks/hallazgos/useHallazgosForm";
import useCreateHallazgo from "@/hooks/hallazgos/useCreateHallazgo";
import { useAuth } from '@/context/AuthContext';

export default function HallazgoCreateLayout() {
  const navigate = useNavigate();
  // Obtiene el usuario Y el estado de carga del contexto
  const { user, loading: authLoading } = useAuth();

  const {
    form,
    handleChange,
    handleCaracteristicaChange,
    addCaracteristica,
    removeCaracteristica,
    handleVestimentaChange,
    addVestimenta,
    removeVestimenta,
  } = useHallazgosForm();

  const {
    createHallazgo,
    loading: formLoading,
    error: formError,
    success,
  } = useCreateHallazgo();
  
  
  const handleSubmit = async (e) => {
  e.preventDefault();

  // 👉 Tomamos el id con fallback a diferentes nombres posibles
  const idUsuario =
    user?.id ?? user?.id_usuario ?? user?.user_id ?? user?.uuid ?? null;

    console.log("👤 user en handleSubmit:", user);
    console.log("🆔 idUsuario calculado:", idUsuario);

  if (authLoading || !user || !idUsuario) {
    console.error("Error: Usuario no autenticado o no disponible. Intente de nuevo.");
    return;
  }

  const hallazgoDataToSend = {
    ...form,
    id_usuario_buscador: idUsuario,
  };

  // 👀 Log para verificar qué se envía al backend
  console.log("🛰️ Payload /api/hallazgos =>", hallazgoDataToSend);

  try {
    const result = await createHallazgo(hallazgoDataToSend);
    if (result) {
      navigate('/dashboard/hallazgos');
    }
  } catch (err) {
    console.error("Error al crear hallazgo:", err);
  }
};


  // 2. Muestra un estado de carga mientras los datos de auth se cargan
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
              form={form}
              handleChange={handleChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Rasgos Fisicos del Hallazgo</CardTitle>
          </CardHeader>
          <CardContent>
            <HallazgoCaracteristicas
              caracteristicas={form.caracteristicas_hallazgo}
              handleCaracteristicaChange={handleCaracteristicaChange}
              addCaracteristica={addCaracteristica}
              removeCaracteristica={removeCaracteristica}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Vestimenta del Hallazgo</CardTitle>
          </CardHeader>
          <CardContent>
            <HallazgoVestimenta
              vestimenta={form.vestimenta_hallazgo}
              handleVestimentaChange={handleVestimentaChange}
              addVestimenta={addVestimenta}
              removeVestimenta={removeVestimenta}
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
        {success && (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>¡Éxito!</AlertTitle>
            <AlertDescription>El hallazgo se ha creado correctamente.</AlertDescription>
          </Alert>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          // Deshabilita el botón si el formulario está en carga o si la autenticación aún no termina
          disabled={formLoading || authLoading}
        >
          {formLoading ? "Creando..." : "Crear Hallazgo"}
        </Button>
      </form>
    </div>
  );
}