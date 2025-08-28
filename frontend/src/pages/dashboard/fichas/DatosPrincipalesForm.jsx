// src/components/fichas/DatosPrincipalesForm.jsx

// Se eliminó useState ya que el estado viene del componente padre
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import useCatalogos from "@/hooks/useCatalogos";

// Acepta `datos` y `setDatos` como props
export default function DatosPrincipalesForm({ datos, setDatos }) {
  const { tiposLugar, loading, error } = useCatalogos();

  // El cambio ahora actualiza el estado del padre
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos(prevDatos => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  // La fecha también actualiza el estado del padre
  const handleFecha = (day) => {
    setDatos(prevDatos => ({
      ...prevDatos,
      fecha_desaparicion: format(day, "yyyy-MM-dd"),
    }));
  };

  // El select también actualiza el estado del padre
  const handleSelectChange = (value) => {
    setDatos(prevDatos => ({
      ...prevDatos,
      id_tipo_lugar_desaparicion: value,
    }));
  };

  // Se eliminó la función handleSubmit ya que el botón de envío está en el componente padre.

  if (loading) return <p>Cargando catálogos...</p>;
  if (error) return <p>Error al cargar catálogos: {error}</p>;

  return (
    <div className="space-y-4 p-4 border rounded-2xl shadow-md bg-white">
      {/* Resto del formulario (campos de nombre, etc.) */}
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input 
          id="nombre" 
          name="nombre" 
          value={datos.nombre} // Usa el prop `datos`
          onChange={handleChange} 
          required 
        />
      </div>

      <div>
        <Label htmlFor="segundo_nombre">Segundo nombre</Label>
        <Input 
          id="segundo_nombre" 
          name="segundo_nombre" 
          value={datos.segundo_nombre} 
          onChange={handleChange} 
        />
      </div>

      <div>
        <Label htmlFor="apellido_paterno">Apellido paterno *</Label>
        <Input 
          id="apellido_paterno" 
          name="apellido_paterno" 
          value={datos.apellido_paterno} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div>
        <Label htmlFor="apellido_materno">Apellido materno</Label>
        <Input 
          id="apellido_materno" 
          name="apellido_materno" 
          value={datos.apellido_materno} 
          onChange={handleChange} 
        />
      </div>

      <div>
        <Label>Fecha de desaparición *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {datos.fecha_desaparicion ? format(new Date(datos.fecha_desaparicion), "PPP") : <span>Selecciona una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar 
              mode="single" 
              selected={datos.fecha_desaparicion ? new Date(datos.fecha_desaparicion) : null} 
              onSelect={handleFecha} 
              initialFocus 
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="ubicacion">Ubicación (estado / municipio)</Label>
        {/* Cambiado para usar el objeto `ubicacion_desaparicion` */}
        <Input 
          id="ubicacion" 
          name="ubicacion" 
          value={datos.ubicacion_desaparicion.estado} 
          onChange={(e) => setDatos(prev => ({ 
            ...prev, 
            ubicacion_desaparicion: { ...prev.ubicacion_desaparicion, estado: e.target.value }
          }))} 
        />
      </div>

      {/* Select para el tipo de lugar, ahora con datos de la API */}
      <div>
        <Label>Tipo de lugar *</Label>
        <Select
          onValueChange={handleSelectChange} // Usamos el manejador que actualiza el estado del padre
          value={datos.id_tipo_lugar_desaparicion}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo de lugar" />
          </SelectTrigger>
          <SelectContent>
            {tiposLugar.map((tipo) => (
              <SelectItem key={tipo.id_tipo_lugar} value={tipo.id_tipo_lugar.toString()}>
                {tipo.nombre_tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
