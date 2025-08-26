import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import useCatalogos from "@/hooks/useCatalogos"

export default function VestimentaForm() {
  // Estado inicial mejorado
  const [vestimenta, setVestimenta] = useState([
    { id_prenda: "", prenda_seleccionada: null, color: "", marca: "", caracteristica_especial: "" },
  ])

  const { prendas, loading, error } = useCatalogos() // <-- Agrega esta línea

  const addPrenda = () => {
    setVestimenta([...vestimenta, { id_prenda: "", prenda: "", color: "", marca: "", caracteristica_especial: "" }])
  }

  const handleChange = (index, field, value) => {
    const newVestimenta = [...vestimenta]
    newVestimenta[index][field] = value
    setVestimenta(newVestimenta)
  }

   // Maneja los estados de carga y error (opcional pero muy recomendado)
  if (loading) return <p>Cargando prendas...</p>
  if (error) return <p>Error al cargar prendas: {error}</p>

  return (
    <div className="space-y-4">
      {vestimenta.map((item, index) => (
        <Card key={index} className="p-4">
          <CardContent className="grid gap-4">
            <div>
              <Label>Prenda</Label>
              <Select
                onValueChange={(value) => handleChange(index, "prenda", value)}
                value={item.prenda}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prenda" />
                </SelectTrigger>
                <SelectContent>
                  {prendas.map((prenda) => (
                    // Usa las propiedades correctas: id_prenda, tipo_prenda y categoria_general
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
  )
}
