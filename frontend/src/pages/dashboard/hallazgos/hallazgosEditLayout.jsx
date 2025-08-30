// src/pages/dashboard/hallazgos/HallazgoEditLayout.jsx

import { useParams } from "react-router-dom";
import { useFetchHallazgo } from "@/hooks/hallazgos/useFetchHallazgo";
import useHallazgosForm from "@/hooks/hallazgos/useHallazgosForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HallazgoDatosPrincipales from "./hallazgoDatosPrincipales";
import HallazgoCaracteristicas from "./hallazgoCaracteristicas";
import HallazgoVestimenta from "./hallazgoVestimenta";

export default function HallazgoEditLayout() {
  const { id } = useParams();
  const { hallazgo, loading, error } = useFetchHallazgo(id);
  const {
    form,
    loading: formLoading,
    error: formError,
    success,
    handleChange,
    handleCaracteristicaChange,
    addCaracteristica,
    removeCaracteristica,
    handleVestimentaChange,
    addVestimenta,
    removeVestimenta,
    handleSubmit,
  } = useHallazgosForm(hallazgo);

  if (loading) {
    return <div className="text-center p-8">Cargando detalles del hallazgo...</div>;
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

  // Se asegura de que el formulario no se renderice hasta que tenga los datos iniciales
  if (!hallazgo) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Editar Hallazgo</h1>
      <form onSubmit={(e) => handleSubmit(e, id)} className="space-y-6">
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
            <CardTitle>2. Características del Hallazgo</CardTitle>
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
        
        {/* Mensajes de estado del formulario */}
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
            <AlertDescription>El hallazgo se ha actualizado correctamente.</AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={formLoading}>
          {formLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
}