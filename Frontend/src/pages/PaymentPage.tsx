import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { money } from '../domain/brisa'
import { Button } from '../components/ui/Button'
import { PropertySummary } from '../components/ui/PropertySummary'

export function PaymentPage() {
  const {
    user,
    pendingQuote,
    openModal,
  } = useBrisa()
  const navigate = useNavigate()
  const [selectedAccount, setSelectedAccount] = useState<number | null>(
    user?.accounts[0]?.id ?? null,
  )
  const [error, setError] = useState('')

  if (!user || !pendingQuote) {
    return <Navigate to="/" replace />
  }

  const quote = pendingQuote

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedAccount === null) {
      setError('Selecciona una cuenta bancaria')
      return
    }

    setError('')
    openModal({
      type: 'confirm-payment',
      accountId: selectedAccount,
      total: quote.total,
    })
  }

  return (
    <>
      <h1>Confirma tu próxima escapada</h1>
      <p className="muted">
        Revisa tu estancia y elige la cuenta con la que quieres pagar.
      </p>
      <div className="detail">
        <section className="panel">
          <h2>Seleccionar cuenta</h2>
          <form id="payment" onSubmit={handleSubmit}>
            {user.accounts.map((account) => (
              <label className="account" key={account.id}>
                <input
                  type="radio"
                  name="account"
                  value={account.id}
                  checked={selectedAccount === account.id}
                  onChange={() => setSelectedAccount(account.id)}
                />
                <span>
                  {account.bank} · {account.type} · ••••{' '}
                  {account.number.slice(-4)}
                  <br />
                  <small>Saldo disponible: {money(account.balance)}</small>
                </span>
              </label>
            ))}
            {error ? <p className="error">{error}</p> : null}
            <Button variant="primary" full type="submit">
              Continuar al pago · {money(pendingQuote.total)}
            </Button>
          </form>
          <div className="row">
            <Button variant="link" onClick={() => openModal({ type: 'deposit' })}>
              Ingresar fondos
            </Button>
            <Button
              variant="link"
              onClick={() => openModal({ type: 'add-account' })}
            >
              Añadir cuenta
            </Button>
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
