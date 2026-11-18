import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { money } from '../domain/brisa'
import { Button } from '../components/ui/Button'
import { PropertySummary } from '../components/ui/PropertySummary'

export function PaymentPage() {
  const { user, pendingQuote, openModal } = useBrisa()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  if (user?.role !== 'cliente' || !pendingQuote) {
    return <Navigate to="/" replace />
  }

  const quote = pendingQuote

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user?.accounts.length) {
      setError('No tienes una cuenta bancaria registrada')
      return
    }

    setError('')
    openModal({ type: 'confirm-payment', total: quote.total })
  }

  return (
    <>
      <h1>Confirma tu próxima escapada</h1>
      <p className="muted">
        Revisa tu estancia y la cuenta con la que se realizará el pago.
      </p>
      <div className="detail">
        <section className="panel">
          <h2>Cuenta de pago</h2>
          <form id="payment" onSubmit={handleSubmit}>
            {user.accounts.map((account) => (
              <div className="account" key={account.id}>
                <span>
                  {account.bank} · {account.type} · ••••{' '}
                  {account.number.slice(-4)}
                  <br />
                  <small>
                    El cobro se hará a esta cuenta al confirmar la reserva.
                  </small>
                </span>
              </div>
            ))}
            {error ? <p className="error">{error}</p> : null}
            <Button variant="primary" full type="submit">
              Continuar al pago · {money(pendingQuote.total)}
            </Button>
          </form>
          <div className="row">
            <Button
              variant="link"
              onClick={() => navigate(`/alojamiento/${pendingQuote.property}`)}
            >
              Volver al inmueble
            </Button>
          </div>
        </section>
        <aside className="panel">
          <PropertySummary data={pendingQuote} />
        </aside>
      </div>
    </>
  )
}
