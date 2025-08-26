// src/components/fichas/DatosPrincipalesForm.jsx
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import useCatalogos from "@/hooks/useCatalogos" // Importa el hook para obtener los datos de la API

export default function DatosPrincipalesForm({ onSubmit }) {
  const { tiposLugar, loading, error } = useCatalogos() // Usa el hook para obtener los tipos de lugar
  const [fecha, setFecha] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    segundo_nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_desaparicion: "",
    ubicacion: "",
    tipo_lugar: "",
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFecha = (day) => {
    setFecha(day)
    setFormData({ ...formData, fecha_desaparicion: format(day, "yyyy-MM-dd") })
  }
  
  // Manejador para el cambio en el select
  const handleSelectChange = (value) => {
    setFormData({ ...formData, tipo_lugar: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) onSubmit(formData)
  }

  // Maneja los estados de carga y error antes de renderizar el formulario
  if (loading) return <p>Cargando catálogos...</p>
  if (error) return <p>Error al cargar catálogos: {error}</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-2xl shadow-md bg-white">
      <h2 className="text-xl font-semibold">Datos principales</h2>

      {/* Resto del formulario (campos de nombre, etc.) */}
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
      </div>

      <div>
        <Label htmlFor="segundo_nombre">Segundo nombre</Label>
        <Input id="segundo_nombre" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="apellido_paterno">Apellido paterno *</Label>
        <Input id="apellido_paterno" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required />
      </div>

      <div>
        <Label htmlFor="apellido_materno">Apellido materno</Label>
        <Input id="apellido_materno" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} />
      </div>

      <div>
        <Label>Fecha de desaparición *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fecha ? format(fecha, "PPP") : <span>Selecciona una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={fecha} onSelect={handleFecha} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="ubicacion">Ubicación (estado / municipio)</Label>
        <Input id="ubicacion" name="ubicacion" value={formData.ubicacion} onChange={handleChange} />
      </div>

      {/* Select para el tipo de lugar, ahora con datos de la API */}
      <div>
        <Label>Tipo de lugar *</Label>
        <Select
          onValueChange={handleSelectChange} // Usamos un manejador para el select
          value={formData.tipo_lugar}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo de lugar" />
          </SelectTrigger>
          <SelectContent>
            {/* Si la API devuelve un array de objetos con `id_tipo_lugar` y `nombre_tipo` */}
            {tiposLugar.map((tipo) => (
              <SelectItem key={tipo.id_tipo_lugar} value={tipo.nombre_tipo}>
                {tipo.nombre_tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">Guardar datos principales</Button>
    </form>
  )
}
