// RUTA: src/pages/dashboard/fichas/VestimentaForm.jsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import useCatalogos from "@/hooks/useCatalogos";
import { MinusCircle, Loader2 } from "lucide-react";

// ✅ 1. RECIBIMOS LAS FUNCIONES DEL HOOK PADRE
export default function VestimentaForm({
    vestimenta,
    handleArrayChange,
    addArrayItem,
    removeArrayItem
}) {
    const { prendas, isLoading: catalogosLoading, error: catalogosError } = useCatalogos();

    if (catalogosLoading) return <div className="flex items-center text-sm text-gray-500"><Loader2 className="animate-spin mr-2 h-4 w-4" />Cargando opciones...</div>;
    if (catalogosError) return <div className="text-red-500 text-sm">{catalogosError}</div>;

    return (
        <div className="space-y-4">
            {(vestimenta || []).map((item, index) => (
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
                            <Label>Prenda</Label>
                            <Select
                                onValueChange={(value) => handleArrayChange(index, "id_prenda", parseInt(value))}
                                value={item.id_prenda ? String(item.id_prenda) : ""}
                            >
                                <SelectTrigger><SelectValue placeholder="Selecciona prenda" /></SelectTrigger>
                                <SelectContent>
                                    {prendas.map((prenda) => (
                                        <SelectItem key={prenda.id_prenda} value={String(prenda.id_prenda)}>
                                            {prenda.tipo_prenda}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* ✅ 2. LOS INPUTS AHORA USAN `handleArrayChange` */}
                        <div className="space-y-1.5">
                            <Label>Color</Label>
                            <Input value={item.color || ''} onChange={(e) => handleArrayChange(index, "color", e.target.value)} placeholder="Ej: Negro" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Marca</Label>
                            <Input value={item.marca || ''} onChange={(e) => handleArrayChange(index, "marca", e.target.value)} placeholder="Ej: Nike" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Característica especial</Label>
                            <Input value={item.caracteristica_especial || ''} onChange={(e) => handleArrayChange(index, "caracteristica_especial", e.target.value)} placeholder="Ej: Logo en espalda" />
                        </div>
                    </CardContent>
                </Card>
            ))}
            {/* ✅ 3. EL BOTÓN AHORA USA `addArrayItem` */}
            <Button type="button" onClick={addArrayItem} variant="outline" size="sm">
                + Agregar Prenda
            </Button>
        </div>
    );
}