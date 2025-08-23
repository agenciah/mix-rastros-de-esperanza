export default function DatosFiscales({ usuario, onChange }) {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Datos Fiscales</h2>

      {/* Datos fiscales para tickets */}
      <div className="mb-4 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Para Tickets</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Razón Social</label>
            <input
              type="text"
              className="input"
              value={usuario.razon_social_tickets || ''}
              onChange={(e) => onChange('razon_social_tickets', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">RFC</label>
            <input
              type="text"
              className="input"
              value={usuario.rfc_tickets || ''}
              onChange={(e) => onChange('rfc_tickets', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Uso CFDI</label>
            <input
              type="text"
              className="input"
              value={usuario.uso_cfdi_tickets || ''}
              onChange={(e) => onChange('uso_cfdi_tickets', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Código Postal</label>
            <input
              type="text"
              className="input"
              value={usuario.cp_fiscal_tickets || ''}
              onChange={(e) => onChange('cp_fiscal_tickets', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email Fiscal</label>
            <input
              type="email"
              className="input"
              value={usuario.email_fiscal_tickets || ''}
              onChange={(e) => onChange('email_fiscal_tickets', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Datos fiscales para servicio */}
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Para Servicio Simplika</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Razón Social</label>
            <input
              type="text"
              className="input"
              value={usuario.razon_social_servicio || ''}
              onChange={(e) => onChange('razon_social_servicio', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">RFC</label>
            <input
              type="text"
              className="input"
              value={usuario.rfc_servicio || ''}
              onChange={(e) => onChange('rfc_servicio', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Uso CFDI</label>
            <input
              type="text"
              className="input"
              value={usuario.uso_cfdi_servicio || ''}
              onChange={(e) => onChange('uso_cfdi_servicio', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Código Postal</label>
            <input
              type="text"
              className="input"
              value={usuario.cp_fiscal_servicio || ''}
              onChange={(e) => onChange('cp_fiscal_servicio', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email Fiscal</label>
            <input
              type="email"
              className="input"
              value={usuario.email_fiscal_servicio || ''}
              onChange={(e) => onChange('email_fiscal_servicio', e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
