import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { money } from '../../domain/brisa'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface ConfirmPaymentModalProps {
  total: number
}

export function ConfirmPaymentModal({ total }: ConfirmPaymentModalProps) {
  const { pendingQuote, pay, closeModal } = useBrisa()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function confirm() {
    if (!pendingQuote) {
      closeModal()
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await pay(pendingQuote)
      closeModal()
      navigate('/reserva-confirmada')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog>
      <h2>Confirmar transacción</h2>
      <p>
        El costo total es {money(total)}. ¿Confirmas la transacción? El cobro
        simulado será aprobado por el backend.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <Button
        variant="primary"
        full
        onClick={confirm}
        disabled={submitting}
      >
        {submitting ? 'Procesando...' : 'Confirmar'}
      </Button>
      <Button full onClick={closeModal}>
        Cancelar
      </Button>
    </Dialog>
  )
}
