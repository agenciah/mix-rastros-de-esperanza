// src/pages/dashboard/fichas/FichaEditLayout.jsx

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import useFichaForm from "@/hooks/useFichaForm";
import useFetchFicha from "@/hooks/editFicha/useFetchFicha";
import useEditFicha from "@/hooks/editFicha/useEditFicha";
import RasgosFisicosForm from "../RasgosFisicosForm";
import VestimentaForm from "../VestimentaForm";
import DatosPrincipalesForm from "../DatosPrincipalesForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Lightbulb } from "lucide-react";

export default function FichaEditLayout() {
  // 1. Obtiene el ID de la URL
  const { id } = useParams();

  // 2. Trae los datos de la ficha existente
  const { data: fichaData, loading: fetching, error: fetchError } = useFetchFicha(id);

  // 3. Usa el hook de formulario para gestionar el estado de los inputs
  const form = useFichaForm();
  const {
    datosPrincipales, setDatosPrincipales,
    rasgosFisicos, setRasgosFisicos,
    vestimenta, setVestimenta,
  } = form;

  // 4. Usa el hook de edición para manejar la actualización
  const { editFicha, loading: isEditing, error: editError, success: editSuccess } = useEditFicha();

  // 5. Precarga el formulario con los datos obtenidos
  useEffect(() => {
    // AHORA CHECAMOS POR 'fichaData' Y 'fichaData.data'
    if (fichaData && fichaData.data) {
      // Mapear los datos de la API al estado del formulario
      const dataToMap = fichaData.data;
      setDatosPrincipales({
        nombre: dataToMap.nombre || "",
        segundo_nombre: dataToMap.segundo_nombre || "",
        apellido_paterno: dataToMap.apellido_paterno || "",
        apellido_materno: dataToMap.apellido_materno || "",
        fecha_desaparicion: dataToMap.fecha_desaparicion || "",
        ubicacion_desaparicion: dataToMap.ubicacion_desaparicion || {
          estado: "",
          municipio: "",
          localidad: "",
          calle: "",
          referencias: "",
          latitud: "",
          longitud: "",
          codigo_postal: "",
        },
        id_tipo_lugar_desaparicion: dataToMap.id_tipo_lugar_desaparicion || "",
        foto_perfil: dataToMap.foto_perfil || null,
      });
      // AQUI MAPEAMOS LOS ARRAYS, POR ESO ES IMPORTANTE QUE EL BACKEND NOS LOS REGRESE ASI
      setRasgosFisicos(dataToMap.rasgos_fisicos || [{ id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" }]);
      setVestimenta(dataToMap.vestimenta || [{ id_prenda: "", color: "", marca: "", caracteristica_especial: "" }]);
    }
  }, [fichaData, setDatosPrincipales, setRasgosFisicos, setVestimenta]);

  // Manejador del submit
  const handleEditSubmit = async () => {
    // Aquí se prepara el objeto de datos
    const dataToSend = {
      ...datosPrincipales,
      rasgos: rasgosFisicos,
      vestimenta: vestimenta,
    };

    // Llama a la función de edición
    const result = await editFicha(id, dataToSend);

    // Puedes manejar la navegación o mostrar un mensaje de éxito aquí
    if (result.success) {
      console.log("Ficha actualizada con éxito!");
      // Aquí podrías redirigir al usuario o mostrar un mensaje
    }
  };

  // Manejo de los estados de carga y error
  if (fetching) {
    return <div className="text-center p-8">Cargando ficha para edición...</div>;
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {fetchError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Edición de Ficha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Datos Principales</h2>
            <DatosPrincipalesForm
              datos={datosPrincipales}
              setDatos={setDatosPrincipales}
            />
          </section>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-2">Rasgos Físicos</h2>
            <RasgosFisicosForm
              rasgos={rasgosFisicos}
              setRasgos={setRasgosFisicos}
            />
          </section>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-2">Vestimenta</h2>
            <VestimentaForm
              vestimenta={vestimenta}
              setVestimenta={setVestimenta}
            />
          </section>
          <div className="pt-4">
            <Button onClick={handleEditSubmit} disabled={isEditing}>
              {isEditing ? "Actualizando..." : "Actualizar Ficha"}
            </Button>
            {editError && <p className="text-red-500 mt-2">{editError}</p>}
            {editSuccess && (
              <Alert className="mt-4">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>¡Éxito!</AlertTitle>
                <AlertDescription>
                  La ficha ha sido actualizada correctamente.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
