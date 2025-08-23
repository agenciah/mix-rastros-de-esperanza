import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { PLANES } from '@/constants/planes'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const getPlanPorId = (id) => PLANES.find((p) => p.id === id)

const PlanesContratadosSection = () => {
  const { user, setUser } = useAuth()
  const [plan, setPlan] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Cargar plan actual del usuario
  useEffect(() => {
    if (!user?.id) return

    const obtenerPlan = async () => {
      try {
        const res = await api.get(`/usuarios/${user.id}`)
        console.log('🧾 Plan desde backend:', res.data.plan)
        setPlan(Array.isArray(res.data.plan) ? res.data.plan : [])
      } catch (err) {
        console.error('❌ Error al obtener plan:', err)
        toast.error('No se pudo cargar el plan.')
      } finally {
        setCargando(false)
      }
    }

    obtenerPlan()
  }, [user?.id])

  const handleSeleccionarPlan = async (nuevoPlanId) => {
    const planActual = plan[0]
    const planNuevo = getPlanPorId(nuevoPlanId)
    const planAnterior = getPlanPorId(planActual)

    if (!planNuevo || !planAnterior) {
      toast.error('Plan inválido.')
      return
    }

    if (planNuevo.precio > planAnterior.precio) {
      toast.info('Redirigiendo a pasarela de pago...')
      // Aquí irá lógica futura de Stripe
      return
    }

    try {
      setActualizando(true)
      console.log('📡 Enviando a backend:', { planes: [nuevoPlanId] })
      const response = await api.put('/usuarios/actualizar-planes', { planes: [nuevoPlanId] })
      console.log('✅ Respuesta del backend:', response.data)

      toast.success('✅ Plan actualizado correctamente.')


      // Actualizar en localStorage y AuthContext manualmente
      const updatedUser = { ...user, plan: [nuevoPlanId] }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setPlan([nuevoPlanId])
      setSheetOpen(false)
    } catch (err) {
      console.error('❌ Error al cambiar plan:', err)
      toast.error('No se pudo actualizar el plan.')
    } finally {
      setActualizando(false)
    }
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-semibold">Planes contratados</h2>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin w-4 h-4" /> Cargando plan...
        </div>
      ) : plan.length === 0 ? (
        <p>No tienes planes contratados.</p>
      ) : (
        <ul className="space-y-2">
          {plan.map((planId) => {
            const detalle = getPlanPorId(planId)
            return detalle ? (
              <li key={planId} className="border rounded p-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{detalle.nombre}</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {detalle.descripcion.map((linea, i) => (
                      <li key={i}>{linea}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${detalle.precio} MXN / mes</p>
                </div>
              </li>
            ) : (
              <li key={planId} className="text-sm text-muted-foreground">
                Plan desconocido: {planId}
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button className="mt-4" disabled={actualizando}>
            Cambiar plan
          </Button>
        </SheetTrigger>
        <SheetContent className="h-screen overflow-y-auto pb-8">
          <SheetHeader>
            <SheetTitle>Selecciona un nuevo plan</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {PLANES.map((p) => (
              <div
                key={p.id}
                className="border rounded-md p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{p.nombre}</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {p.descripcion.map((linea, i) => (
                      <li key={i}>{linea}</li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold">${p.precio} MXN / mes</p>
                </div>
                {plan.includes(p.id) ? (
                  <CheckCircle className="text-green-500 w-6 h-6" />
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSeleccionarPlan(p.id)}
                    disabled={actualizando}
                  >
                    {actualizando ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <>
                        Elegir <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default PlanesContratadosSection
