export default function DatosPersonales({ usuario, onChange }) {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Datos Personales</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Nombre</label>
          <input
            type="text"
            className="input"
            value={usuario.nombre || ''}
            onChange={(e) => onChange('nombre', e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="input"
            value={usuario.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Teléfono (WhatsApp)</label>
          <input
            type="text"
            className="input"
            value={usuario.telefono || ''}
            onChange={(e) => onChange('telefono', e.target.value)}
          />
        </div>
      </div>
    </section>
  )
}
