import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import LegalLayout from '@/layouts/LegalLayouts'

const schema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
})

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await api.post('/api/auth/forgot-password', data)
      toast.success('Si el correo existe, recibirás un enlace para restablecer tu contraseña.')
    } catch (err) {
      toast.error('Ocurrió un error. Intenta nuevamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LegalLayout>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-muted p-6 rounded-md w-full max-w-sm space-y-4 shadow">
          <h1 className="text-xl font-bold text-center">Recuperar contraseña</h1>

          <div>
            <label className="text-sm">Correo electrónico</label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full">Enviar enlace</Button>
        </form>
      </LegalLayout>
    </div>
  )
}

export default ForgotPassword
