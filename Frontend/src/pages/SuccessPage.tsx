import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { money } from '../domain/brisa'
import { Button } from '../components/ui/Button'
import { PropertySummary } from '../components/ui/PropertySummary'

export function SuccessPage() {
  const { user, lastBooking } = useBrisa()
  const navigate = useNavigate()

  if (!user || !lastBooking) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="narrow">
      <div className="success">
        <h1>¡Reserva confirmada!</h1>
      </div>
      <div className="panel">
        <PropertySummary data={lastBooking} />
        {lastBooking.payment ? (
          <>
            <p className="success">
              Pago aprobado · {money(lastBooking.payment.amount)} · cuenta{' '}
              {lastBooking.payment.paidFromAccount}
            </p>
            <p className="small muted">Transacción {lastBooking.payment.transactionId}</p>
          </>
        ) : null}
      </div>
      <Button
        variant="primary"
        full
        onClick={() => navigate('/reservas')}
      >
        Ver mis reservas
      </Button>
      <Button variant="link" full onClick={() => navigate('/')}>
        Seguir explorando
      </Button>
    </section>
  )
}
