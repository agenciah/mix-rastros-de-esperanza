// RUTA: src/pages/dashboard/fichas/RasgosFisicosForm.jsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import useCatalogos from "@/hooks/useCatalogos";
import { MinusCircle, Loader2 } from "lucide-react";

export default function RasgosFisicosForm({
    rasgos,
    handleArrayChange,
    addArrayItem,
    removeArrayItem
}) {
    const { partesCuerpo, isLoading: catalogosLoading, error: catalogosError } = useCatalogos();

    if (catalogosLoading) return <div className="flex items-center text-sm text-gray-500"><Loader2 className="animate-spin mr-2 h-4 w-4" />Cargando opciones...</div>;
    if (catalogosError) return <div className="text-red-500 text-sm">{catalogosError}</div>;

    return (
        <div className="space-y-4">
            {(rasgos || []).map((rasgo, index) => (
                <Card key={index} className="p-4 bg-gray-50/50 relative">
                    <CardContent className="space-y-3 pt-6">
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
                            <Label>Parte del cuerpo</Label>
                            <Select
                                value={rasgo.id_parte_cuerpo ? String(rasgo.id_parte_cuerpo) : ""}
                                onValueChange={(value) => handleArrayChange(index, "id_parte_cuerpo", parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una parte del cuerpo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partesCuerpo.map((parte) => (
                                        <SelectItem key={parte.id} value={String(parte.id)}>
                                            {parte.nombre} ({parte.categoria})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tipo de rasgo</Label>
                            <Input
                                value={rasgo.tipo_rasgo || ''}
                                // ✅ CORRECCIÓN: Llamamos a la función correcta
                                onChange={(e) => handleArrayChange(index, "tipo_rasgo", e.target.value)}
                                placeholder="Ej: Tatuaje, Cicatriz, Lunar"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Detalle</Label>
                            <Input
                                value={rasgo.descripcion_detalle || ''}
                                // ✅ CORRECCIÓN: Llamamos a la función correcta
                                onChange={(e) => handleArrayChange(index, "descripcion_detalle", e.target.value)}
                                placeholder="Ej: Dragón en el brazo derecho"
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button type="button" onClick={addArrayItem} variant="outline" size="sm">
                + Agregar Rasgo
            </Button>
        </div>
    );
}