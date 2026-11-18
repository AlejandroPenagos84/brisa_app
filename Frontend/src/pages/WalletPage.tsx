import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { money, userLabel } from '../domain/brisa'
import { useAccountActions } from '../hooks/useAccountActions'
import { Button } from '../components/ui/Button'
import { ProfileForm } from '../components/forms/ProfileForm'

export function WalletPage() {
  const { user } = useBrisa()
  const navigate = useNavigate()
  const { handleLogout } = useAccountActions()
  const [editing, setEditing] = useState(false)

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="narrow">
      <p className="eyebrow">MI CUENTA</p>
      <h1>Hola, {user.name}</h1>
      <p>
        {user.email} · {userLabel(user.role)}
      </p>
      <p>{user.phone}</p>
      <h2>Cuenta bancaria registrada</h2>
      {user.accounts.map((account) => (
        <div className="panel wallet-account" key={account.id}>
          <strong>
            {account.bank} · {account.type}
          </strong>
          <p>•••• {account.number.slice(-4)}</p>
          {account.balanceKnown ? (
            <h2>{money(account.balance)}</h2>
          ) : (
            <p className="muted">Cuenta utilizada para los pagos simulados.</p>
          )}
        </div>
      ))}
      {editing ? (
        <ProfileForm key={user.id} user={user} onClose={() => setEditing(false)} />
      ) : (
        <Button onClick={() => setEditing(true)}>Editar datos y cuenta bancaria</Button>
      )}
      <div className="row">
        <Button variant="primary" onClick={() => navigate('/')}>
          Explorar alojamientos
        </Button>
        {user.role === 'administrador' ? (
          <Button onClick={() => navigate('/admin')}>
            Ir al panel de administración
          </Button>
        ) : null}
        <Button variant="link" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </section>
  )
}
