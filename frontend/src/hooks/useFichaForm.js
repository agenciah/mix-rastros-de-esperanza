// src/hooks/useFichaForm.js
import { useState } from "react";
import { toast } from "sonner"; 
import useCreateFicha from "@/hooks/useCreateFicha";

export default function useFichaForm() {
  const { createFicha: CreateFicha } = useCreateFicha();

  const [datosPrincipales, setDatosPrincipales] = useState({
    nombre: "",
    segundo_nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_desaparicion: "",
    ubicacion_desaparicion: {
      estado: "",
      municipio: "",
      localidad: "",
      calle: "",
      referencias: "",
      latitud: "",
      longitud: "",
      codigo_postal: "",
    },
    id_tipo_lugar_desaparicion: "",
    foto_perfil: null,
  });

  const [rasgosFisicos, setRasgosFisicos] = useState([
    { id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" },
  ]);

  const [vestimenta, setVestimenta] = useState([
    { id_prenda: "", color: "", marca: "", caracteristica_especial: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset general
  const resetForm = () => {
    setDatosPrincipales({
      nombre: "",
      segundo_nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_desaparicion: "",
      ubicacion_desaparicion: {
        estado: "",
        municipio: "",
        localidad: "",
        calle: "",
        referencias: "",
        latitud: "",
        longitud: "",
        codigo_postal: "",
      },
      id_tipo_lugar_desaparicion: "",
      foto_perfil: null,
    });
    setRasgosFisicos([{ id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" }]);
    setVestimenta([{ id_prenda: "", color: "", marca: "", caracteristica_especial: "" }]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // No incluimos el id_usuario aquí, el backend lo maneja
      const payload = {
        ...datosPrincipales,
        rasgos_fisicos: rasgosFisicos,
        vestimenta,
      };

      const res = await CreateFicha(payload);
      console.log("Respuesta backend:", res);

      if (res.success) {
        toast.success(res.message || "Ficha creada correctamente");
        resetForm();
      } else {
        toast.error(res.message || "Error al crear ficha");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message || "Error al crear ficha");
    } finally {
      setLoading(false);
    }
  };

  return {
    datosPrincipales, setDatosPrincipales,
    rasgosFisicos, setRasgosFisicos,
    vestimenta, setVestimenta,
    loading, error,
    handleSubmit,
  };
}
