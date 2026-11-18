import { useState } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import { formatDate, money } from '../../domain/brisa'
import type { Booking } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function CancelBookingModal({ booking }: { booking: Booking }) {
  const { cancelBooking, closeModal, showToast } = useBrisa()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function confirmCancellation() {
    setError('')
    setSubmitting(true)
    try {
      await cancelBooking(booking)
      closeModal()
      showToast('Reserva cancelada. El reembolso se envió a tu cuenta bancaria')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cancelar la reserva')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog>
      <h2>Cancelar reserva</h2>
      <p>{booking.title} · {formatDate(booking.start)} → {formatDate(booking.end)}</p>
      <p>Se te devolverán {money(booking.total)} a tu cuenta bancaria.</p>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="row">
        <Button variant="primary" onClick={() => void confirmCancellation()} disabled={submitting}>
          {submitting ? 'Cancelando…' : 'Confirmar cancelación'}
        </Button>
        <Button onClick={closeModal} disabled={submitting}>Mantener reserva</Button>
      </div>
    </Dialog>
  )
}
