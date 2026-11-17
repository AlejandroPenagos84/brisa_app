import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { money } from '../../domain/brisa'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface ConfirmPaymentModalProps {
  accountId: number
  total: number
}

export function ConfirmPaymentModal({
  accountId,
  total,
}: ConfirmPaymentModalProps) {
  const {
    pendingQuote,
    pay,
    closeModal,
    openModal,
  } = useBrisa()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function confirm() {
    if (!pendingQuote) {
      closeModal()
      return
    }

    try {
      pay(pendingQuote, accountId)
      closeModal()
      navigate('/reserva-confirmada')
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Error inesperado'

      if (message === 'Saldo insuficiente') {
        openModal({ type: 'insufficient-funds' })
      } else {
        setError(message)
      }
    }
  }

  return (
    <Dialog>
      <h2>Confirmar transacción</h2>
      <p>
        El costo total es {money(total)}. ¿Confirmas la transacción?
      </p>
      {error ? <p className="error">{error}</p> : null}
      <Button variant="primary" full onClick={confirm}>
        Confirmar
      </Button>
      <Button full onClick={closeModal}>
        Cancelar
      </Button>
    </Dialog>
  )
}
