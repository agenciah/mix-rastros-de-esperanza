// 📁 src/pages/admin/hallazgos/hallazgoFormulario.jsx
import React, { useState, useEffect } from "react";
import apiAdmin from "@/lib/axiosAdmin";
import { toast } from "sonner";
import { FaSpinner, FaTrash, FaPlus } from "react-icons/fa";
import useCatalogos from "../../../hooks/useCatalogos";

const HallazgoFormulario = ({ hallazgo, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    segundo_nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_hallazgo: "",
    descripcion_general_hallazgo: "",
    estado_hallazgo: "encontrado",
    id_tipo_lugar_hallazgo: "",
    ubicacion_hallazgo: {
      estado: "",
      municipio: "",
      localidad: "",
      calle: "",
      referencias: "",
      codigo_postal: "",
    },
    caracteristicas: [],
    vestimenta: [],
  });

  const { tiposLugar, partesCuerpo, prendas, loading: catalogosLoading, error: catalogosError } = useCatalogos();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHallazgoCompleto = async () => {
      if (hallazgo && hallazgo.id_hallazgo) {
        try {
          const response = await apiAdmin.get(`/hallazgos/${hallazgo.id_hallazgo}`);
          const fetchedData = response.data.data;
          
          const ubicacionData = {
            estado: fetchedData.estado || "",
            municipio: fetchedData.municipio || "",
            localidad: fetchedData.localidad || "",
            calle: fetchedData.calle || "",
            referencias: fetchedData.referencias || "",
            codigo_postal: fetchedData.codigo_postal || "",
          };

          setFormData({
            ...fetchedData,
            ubicacion_hallazgo: ubicacionData,
            caracteristicas: fetchedData.caracteristicas || [],
            vestimenta: fetchedData.vestimenta || [],
          });
        } catch (err) {
          console.error("Error al obtener detalles del hallazgo:", err);
          toast.error("Error al cargar los detalles del hallazgo.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchHallazgoCompleto();
  }, [hallazgo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const isUbicacionField = Object.keys(prevData.ubicacion_hallazgo).includes(name);
      if (isUbicacionField) {
        return {
          ...prevData,
          ubicacion_hallazgo: {
            ...prevData.ubicacion_hallazgo,
            [name]: value,
          },
        };
      }
      return {
        ...prevData,
        [name]: value,
      };
    });
  };

  const handleCaracteristicaChange = (index, e) => {
    const { name, value } = e.target;
    const newCaracteristicas = [...formData.caracteristicas];
    newCaracteristicas[index] = { ...newCaracteristicas[index], [name]: value };
    setFormData({ ...formData, caracteristicas: newCaracteristicas });
  };

  const addCaracteristica = () => {
    setFormData({
      ...formData,
      caracteristicas: [...formData.caracteristicas, { id_parte_cuerpo: "", tipo_caracteristica: "", descripcion: "" }],
    });
  };

  const removeCaracteristica = (index) => {
    const newCaracteristicas = formData.caracteristicas.filter((_, i) => i !== index);
    setFormData({ ...formData, caracteristicas: newCaracteristicas });
  };
  
  const handleVestimentaChange = (index, e) => {
    const { name, value } = e.target;
    const newVestimenta = [...formData.vestimenta];
    newVestimenta[index] = { ...newVestimenta[index], [name]: value };
    setFormData({ ...formData, vestimenta: newVestimenta });
  };

  const addVestimenta = () => {
    setFormData({
      ...formData,
      vestimenta: [...formData.vestimenta, { id_prenda: "", color: "", marca: "", caracteristica_especial: "" }],
    });
  };

  const removeVestimenta = (index) => {
    const newVestimenta = formData.vestimenta.filter((_, i) => i !== index);
    setFormData({ ...formData, vestimenta: newVestimenta });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hallazgo && hallazgo.id_hallazgo) {
        await apiAdmin.put(`/hallazgos/${hallazgo.id_hallazgo}`, formData);
        toast.success("Hallazgo actualizado con éxito.");
      } else {
        await apiAdmin.post("/hallazgos", formData);
        toast.success("Hallazgo creado con éxito.");
      }
      onSave();
    } catch (err) {
      console.error("Error al guardar hallazgo:", err.response?.data?.message || err.message);
      toast.error(`Error al guardar hallazgo: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || catalogosLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (catalogosError) {
    return <div className="text-center text-red-500">Error al cargar los catálogos.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        {hallazgo && hallazgo.id_hallazgo ? "Editar Hallazgo" : "Crear Nuevo Hallazgo"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección de Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium text-gray-600 border-b pb-2 mb-2">
              Datos Generales
            </h3>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" className="input-field" required />
            <input type="text" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} placeholder="Segundo Nombre" className="input-field" />
            <input type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} placeholder="Apellido Paterno" className="input-field" required />
            <input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} placeholder="Apellido Materno" className="input-field" />
            <input type="date" name="fecha_hallazgo" value={formData.fecha_hallazgo} onChange={handleChange} placeholder="Fecha de Hallazgo" className="input-field" required />
            <textarea name="descripcion_general_hallazgo" value={formData.descripcion_general_hallazgo} onChange={handleChange} placeholder="Descripción General" className="input-field"></textarea>
            
            {/* Estado del hallazgo */}
            <div className="flex items-center space-x-4">
              <label htmlFor="estado_hallazgo" className="text-gray-600">Estado:</label>
              <select name="estado_hallazgo" value={formData.estado_hallazgo} onChange={handleChange} className="input-field">
                <option value="encontrado">Encontrado</option>
                <option value="resuelto">Resuelto</option>
              </select>
            </div>

            {/* Tipo de lugar */}
            <div className="flex items-center space-x-4">
              <label htmlFor="id_tipo_lugar_hallazgo" className="text-gray-600">Tipo de Lugar:</label>
              <select name="id_tipo_lugar_hallazgo" value={formData.id_tipo_lugar_hallazgo} onChange={handleChange} className="input-field">
                <option value="">Seleccione un tipo de lugar</option>
                {tiposLugar.map((tipo) => (
                  <option key={tipo.id_tipo_lugar} value={tipo.id_tipo_lugar}>
                    {tipo.nombre_tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Sección de Ubicación */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium text-gray-600 border-b pb-2 mb-2">
              Ubicación del Hallazgo
            </h3>
            <input type="text" name="estado" value={formData.ubicacion_hallazgo.estado} onChange={handleChange} placeholder="Estado" className="input-field" />
            <input type="text" name="municipio" value={formData.ubicacion_hallazgo.municipio} onChange={handleChange} placeholder="Municipio" className="input-field" />
            <input type="text" name="localidad" value={formData.ubicacion_hallazgo.localidad} onChange={handleChange} placeholder="Localidad" className="input-field" />
            <input type="text" name="calle" value={formData.ubicacion_hallazgo.calle} onChange={handleChange} placeholder="Calle" className="input-field" />
            <textarea name="referencias" value={formData.ubicacion_hallazgo.referencias} onChange={handleChange} placeholder="Referencias" className="input-field"></textarea>
            <input type="text" name="codigo_postal" value={formData.ubicacion_hallazgo.codigo_postal} onChange={handleChange} placeholder="Código Postal" className="input-field" />
          </div>
        </div>

        {/* Sección de Rasgos Físicos */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-medium text-gray-600 border-b pb-2 mb-2 flex justify-between items-center">
            <span>Características Físicas</span>
            <button type="button" onClick={addCaracteristica} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
              <FaPlus />
            </button>
          </h3>
          {/* Se corrigieron los nombres de las propiedades para que coincidan con el hook */}
          {Array.isArray(formData.caracteristicas) && formData.caracteristicas.map((caracteristica, index) => (
            <div key={index} className="flex items-center space-x-4 border p-4 rounded-lg">
              <select
                name="id_parte_cuerpo"
                value={caracteristica.id_parte_cuerpo}
                onChange={(e) => handleCaracteristicaChange(index, e)}
                className="input-field flex-grow"
              >
                <option value="">Parte del Cuerpo</option>
                {partesCuerpo.map((parte) => (
                  <option key={parte.id} value={parte.id}>
                    {parte.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="tipo_caracteristica"
                value={caracteristica.tipo_caracteristica}
                onChange={(e) => handleCaracteristicaChange(index, e)}
                placeholder="Tipo de Característica"
                className="input-field flex-grow"
              />
              <input
                type="text"
                name="descripcion"
                value={caracteristica.descripcion}
                onChange={(e) => handleCaracteristicaChange(index, e)}
                placeholder="Descripción Detallada"
                className="input-field flex-grow"
              />
              <button type="button" onClick={() => removeCaracteristica(index)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Sección de Vestimenta */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-medium text-gray-600 border-b pb-2 mb-2 flex justify-between items-center">
            <span>Vestimenta</span>
            <button type="button" onClick={addVestimenta} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
              <FaPlus />
            </button>
          </h3>
          {/* ✅ Corrección: Agregamos un chequeo simple para asegurar que sea un array */}
          {Array.isArray(formData.vestimenta) && formData.vestimenta.map((prenda, index) => (
            <div key={index} className="flex items-center space-x-4 border p-4 rounded-lg">
              <select
                name="id_prenda"
                value={prenda.id_prenda}
                onChange={(e) => handleVestimentaChange(index, e)}
                className="input-field flex-grow"
              >
                <option value="">Tipo de Prenda</option>
                {prendas.map((p) => (
                  <option key={p.id_prenda} value={p.id_prenda}>
                    {p.tipo_prenda}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="color"
                value={prenda.color}
                onChange={(e) => handleVestimentaChange(index, e)}
                placeholder="Color"
                className="input-field flex-grow"
              />
              <input
                type="text"
                name="marca"
                value={prenda.marca}
                onChange={(e) => handleVestimentaChange(index, e)}
                placeholder="Marca"
                className="input-field flex-grow"
              />
              <input
                type="text"
                name="caracteristica_especial"
                value={prenda.caracteristica_especial}
                onChange={(e) => handleVestimentaChange(index, e)}
                placeholder="Característica Especial"
                className="input-field flex-grow"
              />
              <button type="button" onClick={() => removeVestimenta(index)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            <span>{hallazgo && hallazgo.id_hallazgo ? "Guardar Cambios" : "Crear Hallazgo"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HallazgoFormulario;
