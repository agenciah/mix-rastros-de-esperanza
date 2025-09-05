/* eslint-disable no-irregular-whitespace */
// 📁 src/pages/admin/usuarios/DatosPersonales.jsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DatosPersonales({ usuario, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          type="text"
          value={usuario.nombre || ''}
          onChange={(e) => onChange('nombre', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={usuario.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono (WhatsApp)</Label>
        <Input
          id="telefono"
          type="text"
          value={usuario.telefono || ''}
          onChange={(e) => onChange('telefono', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="estado_republica">Estado de la República</Label>
        <Input
          id="estado_republica"
          type="text"
          value={usuario.estado_republica || ''}
          onChange={(e) => onChange('estado_republica', e.target.value)}
        />
      </div>
    </div>
  )
}