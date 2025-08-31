// src/components/forms/hallazgos/HallazgoVestimenta.jsx

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusCircle } from "lucide-react";
import useCatalogos from "@/hooks/useCatalogos";

export default function HallazgoVestimenta({
    vestimenta,
    handleVestimentaChange,
    addVestimenta,
    removeVestimenta,
}) {
    const { prendas, loadingCatalogos, errorCatalogos } = useCatalogos();

    if (loadingCatalogos) {
        return <div>Cargando catálogos de prendas...</div>;
    }
    if (errorCatalogos) {
        return <div>Error al cargar catálogos.</div>;
    }
    
    return (
        <div className="space-y-4">
            {vestimenta.map((prenda, index) => (
                <div key={index} className="border p-4 rounded-md space-y-2 relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVestimenta(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                        <MinusCircle size={20} />
                    </Button>
                    <div className="space-y-2">
                        <Label htmlFor={`prenda_${index}`}>Tipo de Prenda</Label>
                        <Select
                            onValueChange={(value) => handleVestimentaChange(index, { target: { name: 'id_prenda', value: parseInt(value, 10) } })}
                            value={prenda.id_prenda ? prenda.id_prenda.toString() : ""}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una prenda" />
                            </SelectTrigger>
                            <SelectContent>
                                {prendas.map(p => (
                                    <SelectItem key={p.id_prenda} value={p.id_prenda.toString()}>
                                        {p.tipo_prenda} ({p.categoria_general})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`color_${index}`}>Color (Opcional)</Label>
                        <Input
                            id={`color_${index}`}
                            name="color"
                            value={prenda.color || ""}
                            onChange={(e) => handleVestimentaChange(index, e)}
                            placeholder="Ej: Negro"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`marca_${index}`}>Marca (Opcional)</Label>
                        <Input
                            id={`marca_${index}`}
                            name="marca"
                            value={prenda.marca || ""}
                            onChange={(e) => handleVestimentaChange(index, e)}
                            placeholder="Ej: Nike"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`caracteristica_especial_${index}`}>Característica especial (Opcional)</Label>
                        <Textarea
                            id={`caracteristica_especial_${index}`}
                            name="caracteristica_especial"
                            value={prenda.caracteristica_especial || ""}
                            onChange={(e) => handleVestimentaChange(index, e)}
                            placeholder="Ej: Logo de Batman en la espalda"
                        />
                    </div>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addVestimenta({ id_prenda: '', color: '', marca: '', caracteristica_especial: '' })}>
                + Agregar Vestimenta
            </Button>
        </div>
    );
}
