import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const schema = z.object({
  razon_social: z.string().min(3, 'Mínimo 3 caracteres'),
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido'),
  codigo_postal: z.string().length(5, 'Código postal inválido'),
  uso_cfdi: z.string().min(2, 'Uso de CFDI requerido'),
})

const RegistroFacturacion = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!location.state?.planes?.length) {
      toast.error('Debes seleccionar un plan primero')
      navigate('/seleccionar-plan')
    }
  }, [location.state?.planes?.length, navigate])

  const onSubmit = async (data) => {
    try {
      console.log('Datos fiscales:', data)
      console.log('Planes seleccionados:', location.state.planes)

      toast.success('Datos fiscales registrados')
      navigate('/dashboard', { state: { planes: location.state.planes } })
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar los datos')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-muted p-6 rounded-md w-full max-w-md space-y-4 shadow"
      >
        <h2 className="text-xl font-bold text-center mb-2">Datos fiscaleszzz</h2>

        <p className="text-sm text-center text-muted-foreground mb-4">
          <strong>Importante:</strong> la factura se enviará al correo con el que te diste de alta.
        </p>

        <div>
          <label className="text-sm">Razón social</label>
          <Input {...register('razon_social')} />
          {errors.razon_social && <p className="text-red-500 text-xs">{errors.razon_social.message}</p>}
        </div>

        <div>
          <label className="text-sm">RFC</label>
          <Input {...register('rfc')} />
          {errors.rfc && <p className="text-red-500 text-xs">{errors.rfc.message}</p>}
        </div>

        <div>
          <label className="text-sm">Código postal</label>
          <Input {...register('codigo_postal')} />
          {errors.codigo_postal && <p className="text-red-500 text-xs">{errors.codigo_postal.message}</p>}
        </div>

        <div>
          <label className="text-sm">Uso de CFDI</label>
          <Input
            {...register('uso_cfdi')}
            placeholder="Ej. G03, P01 o escríbelo manualmente"
          />
          {errors.uso_cfdi && <p className="text-red-500 text-xs">{errors.uso_cfdi.message}</p>}
        </div>

        <Button type="submit" className="w-full">
          Guardar y continuar
        </Button>
      </form>
    </div>
  )
}

export default RegistroFacturacion
