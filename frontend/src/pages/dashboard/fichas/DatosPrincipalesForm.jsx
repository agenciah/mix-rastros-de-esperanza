// RUTA: src/pages/dashboard/fichas/DatosPrincipalesForm.jsx

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale'; // Para formato de fecha en español
import useCatalogos from "@/hooks/useCatalogos";
import ImageUploader from "@/components/ImageUploader";

// ✅ 1. RECIBIMOS LAS PROPS CORRECTAS DEL HOOK UNIFICADO
export default function DatosPrincipalesForm({ form, handleChange, handleNestedChange, setImageFile }) {
    const { tiposLugar, isLoading: catalogosLoading, error: catalogosError } = useCatalogos();

    // Guardia de seguridad para el primer renderizado
    if (!form) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    // --- Handlers específicos para componentes de UI complejos ---
    const handleDateChange = (date) => {
        handleChange({ target: { name: "fecha_desaparicion", value: format(date, "yyyy-MM-dd") } });
    };

    const handleSelectChange = (name, value) => {
        handleChange({ target: { name, value } });
    };

    return (
        <div className="space-y-6">
            {/* --- Sección de Datos Personales --- */}
            <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Datos de la Persona</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="nombre">Nombre(s) *</Label><Input id="nombre" name="nombre" value={form.nombre || ''} onChange={handleChange} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="segundo_nombre">Segundo Nombre</Label><Input id="segundo_nombre" name="segundo_nombre" value={form.segundo_nombre || ''} onChange={handleChange} /></div>
                    <div className="space-y-1.5"><Label htmlFor="apellido_paterno">Apellido Paterno *</Label><Input id="apellido_paterno" name="apellido_paterno" value={form.apellido_paterno || ''} onChange={handleChange} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="apellido_materno">Apellido Materno</Label><Input id="apellido_materno" name="apellido_materno" value={form.apellido_materno || ''} onChange={handleChange} /></div>
                </div>
            </div>

             {/* --- Sección de Foto de Perfil --- */}
            <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Foto de Perfil</h3>
                {form.foto_perfil && (
                    <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600">Foto actual:</p>
                        <img src={form.foto_perfil} alt="Vista previa" className="w-32 h-32 object-cover rounded-md border mt-1"/>
                    </div>
                )}
                <div className="space-y-1.5">
                    <Label>{form.foto_perfil ? 'Cambiar foto' : 'Sube una foto clara del rostro'}</Label>
                    {/* ✅ 2. IMPLEMENTACIÓN DE IMAGEUPLOADER */}
                    <ImageUploader onFileSelect={setImageFile} />
                </div>
            </div>

            {/* --- Sección de Características Físicas --- */}
            <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Características Físicas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="edad_estimada">Edad Estimada</Label><Input id="edad_estimada" name="edad_estimada" type="number" value={form.edad_estimada || ''} onChange={handleChange} /></div>
                    <div className="space-y-1.5"><Label htmlFor="genero">Género</Label><Select onValueChange={(value) => handleSelectChange('genero', value)} value={form.genero || ''}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1.5"><Label htmlFor="estatura">Estatura (cm)</Label><Input id="estatura" name="estatura" type="number" value={form.estatura || ''} onChange={handleChange} /></div>
                    <div className="space-y-1.5"><Label htmlFor="complexion">Complexión</Label><Input id="complexion" name="complexion" value={form.complexion || ''} onChange={handleChange} /></div>
                    <div className="space-y-1.5"><Label htmlFor="peso">Peso (kg)</Label><Input id="peso" name="peso" type="number" value={form.peso || ''} onChange={handleChange} /></div>
                </div>
            </div>

            {/* --- Sección de Datos de la Desaparición --- */}
            <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Datos de la Desaparición</h3>
                <div className="space-y-1.5">
                    <Label>Fecha de Desaparición *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                
                                {/* ✅ CORRECCIÓN 1: Usamos replace para evitar el error de UTC */}
                                {form.fecha_desaparicion 
                                    ? format(new Date(form.fecha_desaparicion.replace(/-/g, '/')), "PPP", { locale: es }) 
                                    : <span>Selecciona una fecha</span>
                                }

                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar 
                                mode="single" 
                                
                                // ✅ CORRECCIÓN 2: Hacemos lo mismo aquí
                                selected={form.fecha_desaparicion ? new Date(form.fecha_desaparicion.replace(/-/g, '/')) : null} 
                                
                                onSelect={handleDateChange} 
                                initialFocus 
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                {/* ✅ 3. DOS INPUTS SEPARADOS PARA UBICACIÓN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="estado">Estado *</Label><Input id="estado" value={form.ubicacion_desaparicion?.estado || ''} onChange={(e) => handleNestedChange('ubicacion_desaparicion.estado', e.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="municipio">Municipio *</Label><Input id="municipio" value={form.ubicacion_desaparicion?.municipio || ''} onChange={(e) => handleNestedChange('ubicacion_desaparicion.municipio', e.target.value)} required /></div>
                </div>
                <div className="space-y-1.5">
                    <Label>Tipo de lugar de la desaparición</Label>
                    <Select onValueChange={(value) => handleSelectChange('id_tipo_lugar_desaparicion', parseInt(value))} value={form.id_tipo_lugar_desaparicion ? String(form.id_tipo_lugar_desaparicion) : ""}>
                        <SelectTrigger disabled={catalogosLoading || !!catalogosError}><SelectValue placeholder="Selecciona un tipo de lugar" /></SelectTrigger>
                        <SelectContent>
                            {tiposLugar.map((tipo) => (<SelectItem key={tipo.id_tipo_lugar} value={String(tipo.id_tipo_lugar)}>{tipo.nombre_tipo}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}