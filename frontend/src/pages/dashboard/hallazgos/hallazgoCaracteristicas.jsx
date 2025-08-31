import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusCircle } from "lucide-react";
import useCatalogos from "@/hooks/useCatalogos";

export default function HallazgoCaracteristicas({
    caracteristicas,
    handleArrayChange, // Propiedad corregida que ahora es la función principal de cambio
    addArrayItem,    // Propiedad corregida para agregar elementos al array
    removeArrayItem, // Propiedad corregida para eliminar elementos del array
}) {
    const { partesCuerpo, loading: catalogosLoading, error: catalogosError } = useCatalogos();

    if (catalogosLoading) return <div>Cargando catálogos de partes del cuerpo...</div>;
    if (catalogosError) return <div>Error al cargar catálogos.</div>;

    return (
        <div className="space-y-4">
            {caracteristicas.map((caracteristica, index) => (
                <div key={index} className="border p-4 rounded-md space-y-2 relative">
                    {/* Botón eliminar */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                        <MinusCircle size={20} />
                    </Button>

                    {/* Selección parte del cuerpo */}
                    <div className="space-y-2">
                        <Label htmlFor={`parte_cuerpo_${index}`}>Parte del Cuerpo</Label>
                        <Select
                            onValueChange={(value) => handleArrayChange(index, 'id_parte_cuerpo', parseInt(value, 10))}
                            value={caracteristica.id_parte_cuerpo ? caracteristica.id_parte_cuerpo.toString() : ""}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una parte del cuerpo" />
                            </SelectTrigger>
                            <SelectContent>
                                {partesCuerpo
                                    .filter(parte => parte.id)
                                    .map(parte => (
                                        <SelectItem key={parte.id} value={parte.id.toString()}>
                                            {parte.nombre} ({parte.categoria})
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipo de característica */}
                    <div className="space-y-2">
                        <Label htmlFor={`tipo_caracteristica_${index}`}>Tipo de Característica</Label>
                        <Input
                            id={`tipo_caracteristica_${index}`}
                            name="tipo_caracteristica"
                            value={caracteristica.tipo_caracteristica || ""}
                            onChange={(e) => handleArrayChange(index, e.target.name, e.target.value)}
                            placeholder="Ej: Tatuaje, Cicatriz, Marca de nacimiento..."
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor={`descripcion_${index}`}>Descripción</Label>
                        <Textarea
                            id={`descripcion_${index}`}
                            name="descripcion"
                            value={caracteristica.descripcion || ""}
                            onChange={(e) => handleArrayChange(index, e.target.name, e.target.value)}
                            placeholder="Ej: Tatuaje de rosa roja en el brazo izquierdo."
                        />
                    </div>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem({ id_parte_cuerpo: '', tipo_caracteristica: '', descripcion: '' })}>
                + Agregar Característica
            </Button>
        </div>
    );
}