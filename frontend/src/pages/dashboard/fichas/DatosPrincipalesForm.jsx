import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import useCatalogos from "../../../hooks/useCatalogos";

export default function DatosPrincipalesForm({ datos, setDatos }) {
  const { tiposLugar, loading, error } = useCatalogos();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos(prevDatos => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  const handleFecha = (day) => {
    setDatos(prevDatos => ({
      ...prevDatos,
      fecha_desaparicion: format(day, "yyyy-MM-dd"),
    }));
  };

  const handleSelectChange = (value, name) => {
    setDatos(prevDatos => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  if (loading) return <p>Cargando catálogos...</p>;
  if (error) return <p>Error al cargar catálogos: {error}</p>;

  return (
    <div className="space-y-4 p-4 border rounded-2xl shadow-md bg-white">
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input 
          id="nombre" 
          name="nombre" 
          value={datos.nombre}
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

      {/* Nuevos campos para género, edad, estatura, complexión y peso */}
      <div>
        <Label htmlFor="genero">Género</Label>
        <Select
          onValueChange={(value) => handleSelectChange(value, "genero")}
          value={datos.genero}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="masculino">Masculino</SelectItem>
            <SelectItem value="femenino">Femenino</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
            <SelectItem value="desconocido">Desconocido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="edad_estimada">Edad estimada</Label>
        <Input 
          id="edad_estimada"
          name="edad_estimada"
          type="number"
          value={datos.edad_estimada}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="estatura">Estatura (cm)</Label>
        <Input 
          id="estatura"
          name="estatura"
          type="number"
          value={datos.estatura}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="complexion">Complexión</Label>
        <Select
          onValueChange={(value) => handleSelectChange(value, "complexion")}
          value={datos.complexion}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la complexión" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delgada">Delgada</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="robusta">Robusta</SelectItem>
            <SelectItem value="desconocido">Desconocido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="peso">Peso (kg)</Label>
        <Input 
          id="peso"
          name="peso"
          type="number"
          value={datos.peso}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <Label>Tipo de lugar *</Label>
        <Select
          onValueChange={(value) => handleSelectChange(value, "id_tipo_lugar_desaparicion")}
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
