import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios' // Ajusta si tu path es diferente

const CancelarCuentaSection = () => {
  const [enviando, setEnviando] = useState(false)
  const [revertir, setRevertir] = useState(false)

  const handleCancelarCuenta = async () => {
    try {
      setEnviando(true)

      await api.post('/cancelaciones', {
        motivo: 'Usuario solicitó la cancelación desde el frontend',
      })

      toast.success('Tu cuenta será desactivada al finalizar tu periodo actual.')
      setRevertir(true)
    } catch (err) {
      console.error(err)
      toast.error('Error al cancelar tu cuenta. Intenta nuevamente más tarde.')
    } finally {
      setEnviando(false)
    }
  }

  const handleRevertirCancelacion = async () => {
    try {
      setEnviando(true)
      await api.post('/cancelaciones/revertir')

      toast.success('Cancelación revertida. Tu cuenta permanecerá activa.')
      setRevertir(false)
    } catch (err) {
      console.error(err)
      toast.error('No se pudo revertir la cancelación. Intenta más tarde.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="border p-4 rounded-xl shadow bg-white space-y-4">
      <h2 className="text-xl font-bold">Cancelar cuenta</h2>
      <p>
        Si deseas cancelar tu cuenta, puedes hacerlo aquí.
      </p>

      {revertir ? (
        <Button variant="outline" onClick={handleRevertirCancelacion} disabled={enviando}>
          Revertir cancelación
        </Button>
      ) : (
        <Button variant="destructive" onClick={handleCancelarCuenta} disabled={enviando}>
          Cancelar mi cuenta
        </Button>
      )}
    </div>
  )
}

export default CancelarCuentaSection
