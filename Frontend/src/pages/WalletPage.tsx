import { Navigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { money } from '../domain/brisa'
import { useAccountActions } from '../hooks/useAccountActions'
import { Button } from '../components/ui/Button'

export function WalletPage() {
  const { user, openModal } = useBrisa()
  const { handleLogout } = useAccountActions()

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="narrow">
      <p className="eyebrow">MI CUENTA</p>
      <h1>Hola, {user.name}</h1>
      <p>
        {user.email} · {user.role === 'propietario' ? 'Propietario' : 'Cliente'}
      </p>
      <h2>Tus cuentas bancarias</h2>
      {user.accounts.map((account) => (
        <div className="panel wallet-account" key={account.id}>
          <strong>
            {account.bank} · {account.type}
          </strong>
          <p>•••• {account.number.slice(-4)}</p>
          <h2>{money(account.balance)}</h2>
        </div>
      ))}
      <div className="row">
        <Button variant="primary" onClick={() => openModal({ type: 'deposit' })}>
          Ingresar fondos
        </Button>
        <Button onClick={() => openModal({ type: 'add-account' })}>
          Registrar otra cuenta
        </Button>
        <Button variant="link" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
      <div className="notice">
        El saldo es simulado. Puedes ingresar fondos para probar pagos y el
        estado de saldo insuficiente.
      </div>
    </section>
  )
}
