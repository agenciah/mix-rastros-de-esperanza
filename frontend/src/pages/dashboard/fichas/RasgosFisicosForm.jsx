import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import useCatalogos from "@/hooks/useCatalogos"

export default function RasgosFisicosForm() {
  const { partesCuerpo, loading, error } = useCatalogos()
  const [rasgos, setRasgos] = useState([
    { id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" },
  ])

  const addRasgo = () => {
    setRasgos([...rasgos, { id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" }])
  }

  const handleChange = (index, field, value) => {
    const newRasgos = [...rasgos]
    newRasgos[index][field] = value
    setRasgos(newRasgos)
  }

  if (loading) return <p>Cargando catálogos...</p>
  if (error) return <p>Error al cargar catálogos: {error}</p>

  return (
    <div className="space-y-4">
      {rasgos.map((rasgo, index) => (
        <Card key={index} className="p-4">
          <CardContent className="grid gap-4">

            {/* Select de parte del cuerpo */}
            <div>
              <Label>Parte del cuerpo</Label>
              <Select
                value={rasgo.id_parte_cuerpo?.toString() || ""}
                onValueChange={(value) => handleChange(index, "id_parte_cuerpo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una parte del cuerpo" />
                </SelectTrigger>
                <SelectContent>
                  {partesCuerpo.map((parte) => (
                    <SelectItem key={parte.id} value={parte.id.toString()}>
                      {parte.nombre} ({parte.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de rasgo */}
            <div>
              <Label>Tipo de rasgo</Label>
              <Input
                value={rasgo.tipo_rasgo}
                onChange={(e) => handleChange(index, "tipo_rasgo", e.target.value)}
                placeholder="Ej: Tatuaje"
              />
            </div>

            {/* Detalle */}
            <div>
              <Label>Detalle</Label>
              <Input
                value={rasgo.descripcion_detalle}
                onChange={(e) => handleChange(index, "descripcion_detalle", e.target.value)}
                placeholder="Ej: Dragón en el brazo derecho"
              />
            </div>

          </CardContent>
        </Card>
      ))}

      <Button onClick={addRasgo} variant="secondary">
        + Agregar Rasgo
      </Button>
    </div>
  )
}
