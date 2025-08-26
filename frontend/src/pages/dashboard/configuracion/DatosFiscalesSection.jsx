import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  razon_social: z.string().min(3, 'Debe tener al menos 3 caracteres'),
  rfc: z.string().min(12, 'RFC inválido'),
  uso_cfdi: z.string().optional(),
  cp_fiscal: z.string().min(5, 'Código postal inválido'),
  email_fiscal: z.string().email('Correo fiscal inválido').optional(),
})

const DatosFiscalesSection = () => {
  
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [datosFiscales, setDatosFiscales] = useState(null)
  const { loading } = useAuth()
  if (loading) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="animate-spin h-4 w-4" /> Cargando usuario...
    </div>
  )
}


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      razon_social: '',
      rfc: '',
      uso_cfdi: '',
      cp_fiscal: '',
      email_fiscal: '',
    },
  })

  useEffect(() => {
    const fetchDatosFiscales = async () => {
      try {
        const res = await api.get('/usuarios/fiscales')
        reset(res.data)
        setDatosFiscales(res.data) // <- aquí el cambio
      } catch (err) {
        console.error('❌ Error al obtener datos fiscales', err)
        toast.error('No se pudieron cargar tus datos fiscales')
      } finally {
        setCargando(false)
      }
    }


    fetchDatosFiscales()
  }, [reset])

  const onSubmit = async (data) => {
    console.log('➡️ Datos enviados al backend:', data) // AGREGAR ESTO
    try {
      await api.put('/usuarios/fiscales', data)
      toast.success('Datos fiscales actualizados correctamente')
      setEditando(false)
      setDatosFiscales(data) 
    } catch (err) {
      console.error('❌ Error al guardar datos fiscales', err)
      toast.error('No se pudieron guardar los datos fiscales')
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="animate-spin h-4 w-4" /> Cargando datos fiscales...
      </div>
    )
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-semibold">Datos fiscales para facturar tus tickets</h2>

      {!editando ? (
        <div className="space-y-2 text-sm">
          <p><strong>Razón social:</strong> {datosFiscales?.razon_social || 'No definido'}</p>
          <p><strong>RFC:</strong> {datosFiscales?.rfc || 'No definido'}</p>
          <p><strong>Uso de CFDI:</strong> {datosFiscales?.uso_cfdi || 'No especificado'}</p>
          <p><strong>Código postal fiscal:</strong> {datosFiscales?.cp_fiscal || 'No definido'}</p>
          <p><strong>Correo fiscal:</strong> {datosFiscales?.email_fiscal || 'No definido'}</p>
          <p className="text-muted-foreground">
            Las facturas serán enviadas por Simplika utilizando estos datos.
          </p>
          <Button variant="outline" onClick={() => setEditando(true)}>Editar</Button>
        </div>

      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm">Razón social</label>
            <Input {...register('razon_social')} />
            {errors.razon_social && <p className="text-xs text-red-500">{errors.razon_social.message}</p>}
          </div>
          <div>
            <label className="text-sm">RFC</label>
            <Input {...register('rfc')} />
            {errors.rfc && <p className="text-xs text-red-500">{errors.rfc.message}</p>}
          </div>
          <div>
            <label className="text-sm">Uso de CFDI (opcional)</label>
            <Input {...register('uso_cfdi')} placeholder="Ej: G03, P01" />
          </div>
          <div>
            <label className="text-sm">Código postal fiscal</label>
            <Input {...register('cp_fiscal')} />
            {errors.cp_fiscal && <p className="text-xs text-red-500">{errors.cp_fiscal.message}</p>}
          </div>
          <div>
            <label className="text-sm">Correo fiscal (opcional)</label>
            <Input {...register('email_fiscal')} />
            {errors.email_fiscal && <p className="text-xs text-red-500">{errors.email_fiscal.message}</p>}
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

export default DatosFiscalesSection
