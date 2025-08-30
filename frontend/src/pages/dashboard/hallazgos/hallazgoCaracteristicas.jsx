// src/components/forms/hallazgos/HallazgoCaracteristicas.jsx

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusCircle } from "lucide-react";
import useCatalogos from "@/hooks/useCatalogos";

export default function HallazgoCaracteristicas({
  caracteristicas,
  handleCaracteristicaChange,
  addCaracteristica,
  removeCaracteristica,
}) {
  const { partesCuerpo, loadingCatalogos, errorCatalogos } = useCatalogos();

  if (loadingCatalogos) return <div>Cargando catálogos de partes del cuerpo...</div>;
  if (errorCatalogos) return <div>Error al cargar catálogos.</div>;

  return (
    <div className="space-y-4">
      {caracteristicas.map((caracteristica, index) => (
        <div key={index} className="border p-4 rounded-md space-y-2 relative">
          {/* Botón eliminar */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeCaracteristica(index)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <MinusCircle size={20} />
          </Button>

          {/* Selección parte del cuerpo */}
          <div className="space-y-2">
            <Label htmlFor={`parte_cuerpo_${index}`}>Parte del Cuerpo</Label>
            <Select
              onValueChange={(value) =>
                handleCaracteristicaChange(index, { target: { name: 'id_parte_cuerpo', value } })
              }
              value={caracteristica.id_parte_cuerpo || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una parte del cuerpo" />
              </SelectTrigger>
              <SelectContent>
                {partesCuerpo.map(parte => (
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
              onChange={(e) => handleCaracteristicaChange(index, e)}
              placeholder="Ej: Tatuaje, Cicatriz, Marca de nacimiento..."
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor={`descripcion_${index}`}>Descripción</Label>
            <Textarea
              id={`descripcion_${index}`}
              name="descripcion" // coincide con hook y tabla
              value={caracteristica.descripcion || ""}
              onChange={(e) => handleCaracteristicaChange(index, e)}
              placeholder="Ej: Tatuaje de rosa roja en el brazo izquierdo."
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addCaracteristica}>
        + Agregar Característica
      </Button>
    </div>
  );
}
