// src/hooks/hallazgos/useHallazgosForm.js

import { useState, useEffect } from 'react';
import { initialHallazgoFormState } from '@/lib/initialFormState'; // Importa un estado inicial

export default function useHallazgosForm(initialData = null) {
  const [form, setForm] = useState(initialData || initialHallazgoFormState);

  // Sincroniza el formulario si los datos iniciales cambian
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleCaracteristicaChange = (index, e) => {
    const { name, value } = e.target;
    const nuevasCaracteristicas = [...form.caracteristicas_hallazgo];
    nuevasCaracteristicas[index] = {
      ...nuevasCaracteristicas[index],
      [name]: value,
    };
    setForm(prevForm => ({ ...prevForm, caracteristicas_hallazgo: nuevasCaracteristicas }));
  };

  const addCaracteristica = () => {
    setForm(prevForm => ({
      ...prevForm,
      caracteristicas_hallazgo: [...prevForm.caracteristicas_hallazgo, {
        tipo_caracteristica: "",
        id_parte_cuerpo: "",
        descripcion: ""
      }],
    }));
  };

  const removeCaracteristica = (index) => {
    const nuevasCaracteristicas = form.caracteristicas_hallazgo.filter((_, i) => i !== index);
    setForm(prevForm => ({ ...prevForm, caracteristicas_hallazgo: nuevasCaracteristicas }));
  };

  const handleVestimentaChange = (index, e) => {
    const { name, value } = e.target;
    const nuevaVestimenta = [...form.vestimenta_hallazgo];
    nuevaVestimenta[index] = {
      ...nuevaVestimenta[index],
      [name]: value,
    };
    setForm(prevForm => ({ ...prevForm, vestimenta_hallazgo: nuevaVestimenta }));
  };

  const addVestimenta = () => {
    setForm(prevForm => ({
      ...prevForm,
      vestimenta_hallazgo: [...prevForm.vestimenta_hallazgo, {
        id_prenda: "",
        color: "",
        marca: "",
        caracteristica_especial: ""
      }],
    }));
  };

  const removeVestimenta = (index) => {
    const nuevaVestimenta = form.vestimenta_hallazgo.filter((_, i) => i !== index);
    setForm(prevForm => ({ ...prevForm, vestimenta_hallazgo: nuevaVestimenta }));
  };

  return {
    form,
    setForm,
    handleChange,
    handleCaracteristicaChange,
    addCaracteristica,
    removeCaracteristica,
    handleVestimentaChange,
    addVestimenta,
    removeVestimenta,
  };
}