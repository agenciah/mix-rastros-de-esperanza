// RUTA: src/pages/dashboard/hallazgos/HallazgoCaracteristicas.jsx

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusCircle, Loader2 } from "lucide-react";
import useCatalogos from "@/hooks/useCatalogos";

export default function HallazgoCaracteristicas({
    caracteristicas,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
}) {
    const { partesCuerpo, isLoading: catalogosLoading, error: catalogosError } = useCatalogos();

    if (catalogosLoading) {
        return <div className="flex items-center text-sm text-gray-500"><Loader2 className="animate-spin mr-2 h-4 w-4" />Cargando opciones...</div>;
    }
    
    if (catalogosError) {
        return <div className="text-red-500 text-sm">Error al cargar catálogos.</div>;
    }

    return (
        <div className="space-y-4">
            {caracteristicas.map((caracteristica, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-3 relative bg-gray-50/50">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 h-8 w-8"
                    >
                        <MinusCircle className="h-5 w-5" />
                    </Button>

                    <div className="space-y-1.5">
                        <Label htmlFor={`parte_cuerpo_${index}`}>Parte del Cuerpo</Label>
                        <Select
                            onValueChange={(value) => handleArrayChange(index, 'id_parte_cuerpo', parseInt(value, 10))}
                            value={caracteristica.id_parte_cuerpo ? String(caracteristica.id_parte_cuerpo) : ""}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una parte del cuerpo" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* ✅ CORRECCIÓN APLICADA AQUÍ */}
                                {partesCuerpo.map(parte => (
                                    <SelectItem 
                                        key={parte.id_parte_cuerpo} 
                                        value={String(parte.id_parte_cuerpo)}
                                    >
                                        {parte.nombre_parte} ({parte.categoria_principal})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`tipo_caracteristica_${index}`}>Tipo de Característica</Label>
                        <Input
                            id={`tipo_caracteristica_${index}`}
                            name="tipo_caracteristica"
                            value={caracteristica.tipo_caracteristica || ""}
                            onChange={(e) => handleArrayChange(index, e.target.name, e.target.value)}
                            placeholder="Ej: Tatuaje, Cicatriz, Lunar..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`descripcion_${index}`}>Descripción</Label>
                        <Textarea
                            id={`descripcion_${index}`}
                            name="descripcion"
                            value={caracteristica.descripcion || ""}
                            onChange={(e) => handleArrayChange(index, e.target.name, e.target.value)}
                            placeholder="Ej: Tatuaje de ancla en el antebrazo derecho."
                        />
                    </div>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addArrayItem}>
                + Agregar Característica
            </Button>
        </div>
    );
}