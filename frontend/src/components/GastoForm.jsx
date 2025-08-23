import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Controller } from 'react-hook-form'
import { useState } from 'react'

const schema = z.object({
  descripcion: z.string().min(3, 'Ingresa una descripción válida'),
  monto: z.preprocess((val) => Number(val), z.number().positive('El monto debe ser mayor a 0')),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  tipo_gasto: z.enum(['corriente', 'facturado_por_usuario']),
  es_facturable: z.boolean().default(false),
  forma_pago: z.string().optional(),
  categoria: z.string().optional(),
  notas: z.string().optional(),
}).refine((data) => {
  if (data.es_facturable) {
    return data.forma_pago && data.forma_pago.trim() !== '';
  }
  return true;
}, {
  message: 'Forma de pago es obligatoria para gastos facturables',
  path: ['forma_pago'],
});

const GastoForm = ({ gastoEditado = null, onSubmitSuccess }) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      descripcion: gastoEditado?.descripcion || '',
      monto: gastoEditado?.monto ?? '',
      fecha: gastoEditado?.fecha || '',
      tipo_gasto: gastoEditado?.tipo_gasto || 'corriente',
      es_facturable: gastoEditado?.es_facturable ?? false,
      forma_pago: gastoEditado?.forma_pago || '',
      categoria: gastoEditado?.categoria || '',
      notas: gastoEditado?.notas || '',
    }
  })
  
  const enviar = async (data) => {
    if (isSubmitting) {
      // Evita envíos duplicados mientras ya se está enviando
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(`[${new Date().toISOString()}] Enviar gasto (editado=${!!gastoEditado}):`, data);

      let response;
      if (gastoEditado) {
        response = await api.put(`/gastos/${gastoEditado.id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success('Gasto actualizado correctamente');
      } else {
        response = await api.post('/gastos', data, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success('Gasto guardado correctamente');
        reset();
      }

      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error('Error al guardar gasto:', error.response?.data || error);
      toast.error('Error al guardar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4 bg-white p-6 rounded shadow max-w-md">
      <div>
        <label className="text-sm">Descripción</label>
        <Input {...register('descripcion')} />
        {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>}
      </div>

      <div>
        <label className="text-sm">Monto</label>
        <Input type="number" step="0.01" {...register('monto')} />
        {errors.monto && <p className="text-xs text-red-500 mt-1">{errors.monto.message}</p>}
      </div>

      <div>
        <label className="text-sm">Fecha</label>
        <Input type="date" {...register('fecha')} />
        {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha.message}</p>}
      </div>

      <div>
        <Controller
          name="tipo_gasto"
          control={control}
          render={({ field }) => (
            <div>
              <label className="text-sm">Tipo de gasto</label>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corriente">Gasto corriente</SelectItem>
                  <SelectItem value="facturado_por_usuario">Gasto con factura propia</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_gasto && (
                <p className="text-xs text-red-500 mt-1">{errors.tipo_gasto.message}</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="es_facturable"
          {...register('es_facturable')}
          checked={watch('es_facturable')}
          onChange={(e) => setValue('es_facturable', e.target.checked, { shouldValidate: true })}
        />
        <label htmlFor="es_facturable" className="text-sm select-none">
          Marcar como facturado por mí
        </label>
      </div>

      <Controller
          name="forma_pago"
          control={control}
          render={({ field }) => (
            <>
              <label className="text-sm">Forma de pago</label>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!watch('es_facturable')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona forma de pago (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.forma_pago && (
                <p className="text-xs text-red-500 mt-1">{errors.forma_pago.message}</p>
              )}
            </>
          )}
        />


      <div>
        <label className="text-sm">Categoría</label>
        <Input {...register('categoria')} placeholder="Ej: comida, transporte, oficina" />
      </div>

      <div>
        <label className="text-sm">Notas</label>
        <textarea 
        {...register('notas')}
        rows={3}
        className="w-full border rounded p-2 resize-none md:resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Comentarios adicionales"
        />
      </div>


      <Button type="submit" className="w-full">
        {gastoEditado ? 'Actualizar gasto' : 'Guardar gasto'}
      </Button>
    </form>
  )
}

export default GastoForm
