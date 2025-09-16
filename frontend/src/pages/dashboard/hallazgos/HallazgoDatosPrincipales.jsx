// RUTA: src/pages/dashboard/hallazgos/HallazgoDatosPrincipales.jsx

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import useCatalogos from "@/hooks/useCatalogos";
import ImageUploader from "@/components/ImageUploader";

// ✅ 1. La prop se llama `form` para mantenerlo corto y consistente.
export default function HallazgoDatosPrincipales({ form, handleChange, handleNestedChange, setImageFile }) {
    const { tiposLugar, loading: catalogosLoading, error: catalogosError } = useCatalogos();

    // ✅ 2. GUARDIA DE SEGURIDAD: Si `form` no existe, no se renderiza nada.
    // Esto previene el error si el componente padre tarda en pasar los datos.
    if (!form) {
        return null; 
    }

    const handleTipoLugarChange = (value) => {
        handleChange({ target: { name: "id_tipo_lugar_hallazgo", value: parseInt(value, 10) } });
    };

    const handleGeneroChange = (value) => {
        handleChange({ target: { name: "genero", value: value } });
    };

    return (
        <div className="space-y-4">
            {/* Sección de Datos de la persona hallada */}
            <h3 className="text-lg font-semibold mt-6">Datos de la persona</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre(s)</Label>
                    <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        value={form.nombre || ""}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="segundo_nombre">Segundo nombre (Opcional)</Label>
                    <Input
                        id="segundo_nombre"
                        name="segundo_nombre"
                        type="text"
                        value={form.segundo_nombre || ""}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apellido_paterno">Apellido paterno</Label>
                    <Input
                        id="apellido_paterno"
                        name="apellido_paterno"
                        type="text"
                        value={form.apellido_paterno || ""}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apellido_materno">Apellido materno</Label>
                    <Input
                        id="apellido_materno"
                        name="apellido_materno"
                        type="text"
                        value={form.apellido_materno || ""}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Sección para subir fotos */}
            <h3 className="text-lg font-semibold mt-6">Foto del Hallazgo</h3>
            <div className="space-y-2">
                <Label>Foto (opcional, pero muy recomendado)</Label>
                <ImageUploader onFileSelect={setImageFile} />
                {form.foto_hallazgo && (
                    <div className="mt-2">
                        <p className="text-sm font-medium">Vista Previa Actual:</p>
                        <img src={form.foto_hallazgo} alt="Vista previa" className="w-32 h-32 object-cover rounded-md border mt-1"/>
                    </div>
                )}
            </div>

            {/* Sección de Características Físicas */}
            <h3 className="text-lg font-semibold mt-6">Características Físicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="edad_estimada">Edad Estimada</Label>
                    <Input
                        id="edad_estimada"
                        name="edad_estimada"
                        type="number"
                        placeholder="Ej: 30"
                        value={form.edad_estimada || ""}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <Select onValueChange={handleGeneroChange} value={form.genero || ""}>
                        <SelectTrigger id="genero">
                            <SelectValue placeholder="Selecciona un género" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                            <SelectItem value="No identificado">No identificado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="estatura">Estatura (cm)</Label>
                    <Input
                        id="estatura"
                        name="estatura"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 175"
                        value={form.estatura || ""}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="complexion">Complexión</Label>
                    <Input
                        id="complexion"
                        name="complexion"
                        type="text"
                        placeholder="Ej: Delgada, Robusta, Normal"
                        value={form.complexion || ""}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                        id="peso"
                        name="peso"
                        type="number"
                        placeholder="Ej: 70"
                        value={form.peso || ""}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Sección de Datos del hallazgo */}
            <h3 className="text-lg font-semibold mt-6">Datos del hallazgo</h3>
            <div className="space-y-2">
                <Label htmlFor="fecha_hallazgo">Fecha del hallazgo</Label>
                <Input
                    id="fecha_hallazgo"
                    name="fecha_hallazgo"
                    type="date"
                    value={form.fecha_hallazgo || ""}
                    onChange={handleChange}
                    required
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="estado">Estado de la República</Label>
                    <Input
                        id="estado"
                        name="ubicacion_hallazgo.estado"
                        type="text"
                        placeholder="Ej: Ciudad de México, Jalisco, Nuevo León..."
                        value={form.ubicacion_hallazgo?.estado || ""}
                        onChange={(e) => handleNestedChange('ubicacion_hallazgo.estado', e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="municipio">Municipio</Label>
                    <Input
                        id="municipio"
                        name="ubicacion_hallazgo.municipio"
                        type="text"
                        placeholder="Ej: Cuauhtémoc, Zapopan, San Nicolás de los Garza..."
                        value={form.ubicacion_hallazgo?.municipio || ""}
                        onChange={(e) => handleNestedChange('ubicacion_hallazgo.municipio', e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="tipo_lugar_hallazgo">Tipo de lugar donde se encontró</Label>
                <Select 
                    onValueChange={handleTipoLugarChange}
                    value={form.id_tipo_lugar_hallazgo ? form.id_tipo_lugar_hallazgo.toString() : ""}
                    disabled={catalogosLoading || catalogosError}
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
                {catalogosLoading && <p className="text-sm text-gray-500">Cargando tipos de lugar...</p>}
                {catalogosError && <p className="text-sm text-red-500">Error al cargar el catálogo.</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="descripcion_general_hallazgo">Detalles del hallazgo</Label>
                <Textarea
                    id="descripcion_general_hallazgo"
                    name="descripcion_general_hallazgo"
                    placeholder="Descripción del hallazgo, como el estado, o detalles del lugar..."
                    value={form.descripcion_general_hallazgo || ""}
                    onChange={handleChange}
                />
            </div>
        </div>
    );
}