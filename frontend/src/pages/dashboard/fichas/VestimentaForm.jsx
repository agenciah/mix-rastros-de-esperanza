// src/pages/dashboard/fichas/VestimentaForm.jsx

// Se eliminó useState ya que el estado viene del componente padre
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import useCatalogos from "@/hooks/useCatalogos";

// Acepta `vestimenta` y `setVestimenta` como props
export default function VestimentaForm({ vestimenta, setVestimenta }) {
  const { prendas, loading, error } = useCatalogos(); // <-- Agrega esta línea

  const addPrenda = () => {
    setVestimenta([...vestimenta, { id_prenda: "", color: "", marca: "", caracteristica_especial: "" }]);
  };

  const handleChange = (index, field, value) => {
    const newVestimenta = [...vestimenta];
    newVestimenta[index][field] = value;
    setVestimenta(newVestimenta);
  };

  // Maneja los estados de carga y error (opcional pero muy recomendado)
  if (loading) return <p>Cargando prendas...</p>;
  if (error) return <p>Error al cargar prendas: {error}</p>;

  return (
    <div className="space-y-4">
      {vestimenta.map((item, index) => (
        <Card key={index} className="p-4">
          <CardContent className="grid gap-4">
            <div>
              <Label>Prenda</Label>
              <Select
                // Usa onValueChange para actualizar el estado del padre
                onValueChange={(value) => handleChange(index, "id_prenda", value)}
                value={item.id_prenda?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prenda" />
                </SelectTrigger>
                <SelectContent>
                  {prendas.map((prenda) => (
                    <SelectItem key={prenda.id_prenda} value={prenda.id_prenda.toString()}>
                      {prenda.tipo_prenda} ({prenda.categoria_general})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <Input
                value={item.color}
                onChange={(e) => handleChange(index, "color", e.target.value)}
                placeholder="Ej: Negro"
              />
            </div>
            <div>
              <Label>Marca</Label>
              <Input
                value={item.marca}
                onChange={(e) => handleChange(index, "marca", e.target.value)}
                placeholder="Ej: Nike"
              />
            </div>
            <div>
              <Label>Característica especial</Label>
              <Input
                value={item.caracteristica_especial}
                onChange={(e) => handleChange(index, "caracteristica_especial", e.target.value)}
                placeholder="Ej: Logo en espalda"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={addPrenda} variant="secondary">
        + Agregar Prenda
      </Button>
    </div>
  );
}
