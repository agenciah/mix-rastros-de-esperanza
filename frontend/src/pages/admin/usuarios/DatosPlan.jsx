export default function DatosPlan({ usuario, onChange }) {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Plan y Facturación</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Plan</label>
          <input
            type="text"
            className="input"
            value={Array.isArray(usuario.plan) ? usuario.plan.join(', ') : usuario.plan || ''}
            onChange={(e) => onChange('plan', e.target.value.split(',').map(p => p.trim()))}
          />
          <small className="text-gray-500">Separar planes con coma</small>
        </div>

        <div>
          <label className="block mb-1 font-medium">Facturas Usadas</label>
          <input
            type="number"
            className="input"
            value={usuario.tickets_facturados || 0}
            onChange={(e) => onChange('tickets_facturados', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Facturas Disponibles</label>
          <input
            type="number"
            className="input"
            value={usuario.facturacion_tickets || 0}
            onChange={(e) => onChange('facturacion_tickets', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Gastos Registrados</label>
          <input
            type="number"
            className="input"
            value={usuario.gastos_registrados || 0}
            onChange={(e) => onChange('gastos_registrados', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Cancelado</label>
          <select
            className="input"
            value={usuario.cancelado ? '1' : '0'}
            onChange={(e) => onChange('cancelado', e.target.value === '1')}
          >
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Fecha de Cancelación</label>
          <input
            type="date"
            className="input"
            value={usuario.cancelacion_efectiva ? usuario.cancelacion_efectiva.split('T')[0] : ''}
            onChange={(e) => onChange('cancelacion_efectiva', e.target.value)}
          />
        </div>
      </div>
    </section>
  )
}
