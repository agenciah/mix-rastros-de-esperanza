// src/hooks/useFichaForm.js
import { useState, useEffect } from "react";
import { toast } from "sonner";
import useCreateFicha from "@/hooks/useCreateFicha";

// Acepta 'initialData' como argumento para prellenar el formulario
export default function useFichaForm(initialData = null) {
  const { createFicha: CreateFicha } = useCreateFicha();

  // El estado se inicializa con los datos de 'initialData' o con un objeto vacío si no se proporcionan datos
  const [datosPrincipales, setDatosPrincipales] = useState(initialData ? {
    nombre: initialData.nombre || "",
    segundo_nombre: initialData.segundo_nombre || "",
    apellido_paterno: initialData.apellido_paterno || "",
    apellido_materno: initialData.apellido_materno || "",
    fecha_desaparicion: initialData.fecha_desaparicion || "",
    ubicacion_desaparicion: {
      estado: initialData.ubicacion_desaparicion?.estado || "",
      municipio: initialData.ubicacion_desaparicion?.municipio || "",
      localidad: initialData.ubicacion_desaparicion?.localidad || "",
      calle: initialData.ubicacion_desaparicion?.calle || "",
      referencias: initialData.ubicacion_desaparicion?.referencias || "",
      latitud: initialData.ubicacion_desaparicion?.latitud || "",
      longitud: initialData.ubicacion_desaparicion?.longitud || "",
      codigo_postal: initialData.ubicacion_desaparicion?.codigo_postal || "",
    },
    id_tipo_lugar_desaparicion: initialData.id_tipo_lugar_desaparicion || "",
    foto_perfil: initialData.foto_perfil || null,
    edad_estimada: initialData.edad_estimada || "",
    genero: initialData.genero || "",
    estatura: initialData.estatura || "",
    complexion: initialData.complexion || "",
    peso: initialData.peso || "",
  } : {
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
    edad_estimada: "",
    genero: "",
    estatura: "",
    complexion: "",
    peso: "",
  });

  const [rasgosFisicos, setRasgosFisicos] = useState(initialData?.rasgos_fisicos || [
    { id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" },
  ]);

  const [vestimenta, setVestimenta] = useState(initialData?.vestimenta || [
    { id_prenda: "", color: "", marca: "", caracteristica_especial: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      edad_estimada: "",
      genero: "",
      estatura: "",
      complexion: "",
      peso: "",
    });
    setRasgosFisicos([{ id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" }]);
    setVestimenta([{ id_prenda: "", color: "", marca: "", caracteristica_especial: "" }]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
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