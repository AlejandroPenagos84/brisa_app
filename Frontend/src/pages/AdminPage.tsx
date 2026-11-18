import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { formatDate, money, rentalStatusLabels, userLabel } from '../domain/brisa'
import { Button } from '../components/ui/Button'
import { TransactionTable } from '../components/ui/TransactionTable'

export function AdminPage() {
  const { db, user, loading, error, refresh } = useBrisa()
  const navigate = useNavigate()

  if (!user || user.role !== 'administrador') {
    return <Navigate to="/" replace />
  }

  const administrator = db.administrator
  const payments = db.transactions.filter(
    (transaction) => transaction.type === 'PAYMENT',
  )
  const refunds = db.transactions.filter(
    (transaction) => transaction.type === 'REFUND',
  )
  const grossVolume = payments.reduce(
    (total, transaction) => total + transaction.grossAmount,
    0,
  )
  const ownerPayouts = db.transactions.reduce(
    (total, transaction) =>
      total +
      (transaction.type === 'PAYMENT'
        ? transaction.netAmount
        : -transaction.netAmount),
    0,
  )
  const owners = db.users.filter((candidate) => candidate.role === 'propietario')
  const clients = db.users.filter((candidate) => candidate.role === 'cliente')
  const ownerName = (ownerId: string) =>
    db.users.find((candidate) => candidate.id === ownerId)?.name ??
    ownerId.slice(0, 8)
  const bankName =
    db.banks.find((bank) => bank.id === administrator?.bankId)?.name ??
    'Banco'

  return (
    <>
      <p className="eyebrow">PANEL DE ADMINISTRACIÓN</p>
      <div className="row between">
        <div>
          <h1>Comisiones de Brisa</h1>
          <p className="muted">
            {user.name} · {userLabel(user.role)}
          </p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading}>Recargar datos</Button>
      </div>

      {loading ? <p className="muted">Cargando datos del backend...</p> : null}
      {error ? (
        <div className="notice">
          <strong>No se pudo actualizar el panel</strong>
          <p>{error}</p>
        </div>
      ) : null}

      <div className="admin-grid">
        <section className="panel admin-stat">
          <small>Saldo de comisiones</small>
          <h2>{money(administrator?.balance ?? 0)}</h2>
          <p className="muted small">Comisiones de pagos y devoluciones</p>
        </section>
        <section className="panel admin-stat">
          <small>Volumen pagado</small>
          <h2>{money(grossVolume)}</h2>
          <p className="muted small">
            {payments.length} pagos · {refunds.length} devoluciones
          </p>
        </section>
        <section className="panel admin-stat">
          <small>Liquidado a propietarios</small>
          <h2>{money(ownerPayouts)}</h2>
          <p className="muted small">Pagos netos tras devoluciones</p>
        </section>
        <section className="panel admin-stat">
          <small>Red Brisa</small>
          <h2>{db.properties.length}</h2>
          <p className="muted small">
            {owners.length} propietarios · {clients.length} clientes
          </p>
        </section>
      </div>

      <div className="admin-columns">
        <section>
          <h2>Movimientos de comisiones</h2>
          <TransactionTable transactions={db.transactions} ownerName={ownerName} />
        </section>

        <aside>
          <h2>Cuenta del administrador</h2>
          <div className="panel">
            <p>
              <strong>{administrator?.name ?? user.name}</strong>
              <br />
              {administrator?.email ?? user.email}
              <br />
              {administrator?.phone ?? user.phone}
            </p>
            <hr />
            <p>
              {bankName}
              <br />
              {administrator?.accountType ?? 'Cuenta'} · ••••{' '}
              {(administrator?.accountNumber ?? '').slice(-4)}
            </p>
            <hr />
            <p>
              <strong>{money(administrator?.balance ?? 0)}</strong>
              <br />
              <small className="muted">Comisiones acumuladas</small>
            </p>
            <Button onClick={() => navigate('/cuenta')}>Administrar cuenta</Button>
          </div>

          <h2>Propietarios</h2>
          {owners.map((owner) => {
            const properties = db.properties.filter(
              (property) => property.owner === owner.id,
            )
            return (
              <div className="admin-owner" key={owner.id}>
                <strong>{owner.name}</strong>
                <p className="small muted">
                  {properties.length} inmuebles ·{' '}
                  {money(owner.accounts[0]?.balance ?? 0)} de saldo
                </p>
              </div>
            )
          })}
        </aside>
      </div>

      <h2>Reservas registradas</h2>
      {!db.bookings.length ? <p className="muted">Aún no hay reservas.</p> : (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Inmueble</th>
              <th>Cliente</th>
              <th>Fechas</th>
              <th>Estado</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {db.bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.title}</td>
                <td>
                  {db.users.find(
                    (candidate) => candidate.id === booking.user,
                  )?.name ?? booking.user.slice(0, 8)}
                </td>
                <td>
                  {formatDate(booking.start)} → {formatDate(booking.end)}
                </td>
                <td>{rentalStatusLabels[booking.status]}</td>
                <td>{money(booking.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  )
}
