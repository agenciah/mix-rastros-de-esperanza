import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  razon_social_servicio: z.string().min(3, 'Debe tener al menos 3 caracteres'),
  rfc_servicio: z.string().min(12, 'RFC inválido'),
  uso_cfdi_servicio: z.string().optional(),
  cp_fiscal_servicio: z.string().min(5, 'Código postal inválido'),
  email_fiscal_servicio: z.string().email('Correo fiscal inválido').optional(),
})

export default function DatosFiscalesServicio() {
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [datosGuardados, setDatosGuardados] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      razon_social_servicio: '',
      rfc_servicio: '',
      uso_cfdi_servicio: '',
      cp_fiscal_servicio: '',
      email_fiscal_servicio: '',
    },
  })

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const res = await api.get('/usuarios/fiscales-servicio')
        reset(res.data)
        setDatosGuardados(res.data)
      } catch (err) {
        console.error('❌ Error al obtener datos fiscales del servicio', err)
        toast.error('No se pudieron cargar los datos fiscales del servicio')
      } finally {
        setCargando(false)
      }
    }

    fetchDatos()
  }, [reset])

  const onSubmit = async (data) => {
    console.log('➡️ Datos fiscales del servicio enviados:', data)
    try {
      await api.put('/usuarios/fiscales-servicio', data)
      toast.success('Datos fiscales del servicio actualizados correctamente')
      setEditando(false)
      setDatosGuardados(data)
    } catch (err) {
      console.error('❌ Error al guardar datos fiscales del servicio', err)
      toast.error('No se pudieron guardar los datos')
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="animate-spin h-4 w-4" /> Cargando datos fiscales del servicio...
      </div>
    )
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-semibold">Datos fiscales para facturar el servicio de Simplika.lat</h2>
      <p className="text-sm text-muted-foreground">
        Estos datos se usarán únicamente si deseas recibir factura por tu suscripción.
      </p>

      {!editando ? (
        <div className="space-y-2 text-sm">
          <p><strong>Razón social:</strong> {datosGuardados?.razon_social_servicio || 'No definido'}</p>
          <p><strong>RFC:</strong> {datosGuardados?.rfc_servicio || 'No definido'}</p>
          <p><strong>Uso de CFDI:</strong> {datosGuardados?.uso_cfdi_servicio || 'No especificado'}</p>
          <p><strong>Código postal fiscal:</strong> {datosGuardados?.cp_fiscal_servicio || 'No definido'}</p>
          <p><strong>Correo fiscal:</strong> {datosGuardados?.email_fiscal_servicio || 'No definido'}</p>
          <Button variant="outline" onClick={() => setEditando(true)}>Editar</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm">Razón social</label>
            <Input {...register('razon_social_servicio')} />
            {errors.razon_social_servicio && <p className="text-xs text-red-500">{errors.razon_social_servicio.message}</p>}
          </div>
          <div>
            <label className="text-sm">RFC</label>
            <Input {...register('rfc_servicio')} />
            {errors.rfc_servicio && <p className="text-xs text-red-500">{errors.rfc_servicio.message}</p>}
          </div>
          <div>
            <label className="text-sm">Uso de CFDI (opcional)</label>
            <Input {...register('uso_cfdi_servicio')} placeholder="Ej: G03, P01" />
          </div>
          <div>
            <label className="text-sm">Código postal fiscal</label>
            <Input {...register('cp_fiscal_servicio')} />
            {errors.cp_fiscal_servicio && <p className="text-xs text-red-500">{errors.cp_fiscal_servicio.message}</p>}
          </div>
          <div>
            <label className="text-sm">Correo fiscal (opcional)</label>
            <Input type="email" {...register('email_fiscal_servicio')} />
            {errors.email_fiscal_servicio && <p className="text-xs text-red-500">{errors.email_fiscal_servicio.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit">Guardar</Button>
            <Button type="button" variant="secondary" onClick={() => setEditando(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}
