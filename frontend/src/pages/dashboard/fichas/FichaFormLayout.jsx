// src/pages/dashboard/fichas/FichaFormLayout.jsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import useFichaForm from "@/hooks/useFichaForm";

import RasgosFisicosForm from "./RasgosFisicosForm";
import VestimentaForm from "./VestimentaForm";
import DatosPrincipalesForm from "./DatosPrincipalesForm";

export default function FichaFormLayout() {
  // Ahora, el hook gestiona todo el estado centralizado
  const form = useFichaForm();
  
  const {
    datosPrincipales, setDatosPrincipales,
    rasgosFisicos, setRasgosFisicos,
    vestimenta, setVestimenta,
    loading, error,
    handleSubmit,
  } = form;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Registro de Ficha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Componente que recibe y actualiza el estado del padre */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Datos Principales</h2>
            <DatosPrincipalesForm
              datos={datosPrincipales}
              setDatos={setDatosPrincipales}
            />
          </section>
          <Separator />

          {/* Componente que recibe y actualiza el estado del padre */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Rasgos Físicos</h2>
            <RasgosFisicosForm
              rasgos={rasgosFisicos}
              setRasgos={setRasgosFisicos}
            />
          </section>
          <Separator />

          {/* Componente que recibe y actualiza el estado del padre */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Vestimenta</h2>
            <VestimentaForm
              vestimenta={vestimenta}
              setVestimenta={setVestimenta}
            />
          </section>

          {/* Botón de submit */}
          <div className="pt-4">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Crear Ficha"}
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
