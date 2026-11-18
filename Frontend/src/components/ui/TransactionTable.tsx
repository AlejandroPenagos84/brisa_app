import { money } from '../../domain/brisa'
import type { Transaction } from '../../types'

const dateTime = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: import.meta.env.VITE_APP_TIME_ZONE || 'America/Bogota',
})

export function TransactionTable({
  transactions,
  ownerName,
}: {
  transactions: Transaction[]
  ownerName?: (id: string) => string
}) {
  if (!transactions.length) return <p className="muted">Aún no hay movimientos.</p>

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Tipo</th>
            {ownerName ? <th scope="col">Propietario</th> : null}
            <th scope="col">Bruto</th>
            <th scope="col">Comisión</th>
            <th scope="col">Neto</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{dateTime.format(new Date(transaction.createdAt))}</td>
              <td>{transaction.type === 'PAYMENT' ? 'Pago' : 'Devolución'}</td>
              {ownerName ? <td>{ownerName(transaction.ownerId)}</td> : null}
              <td>{money(transaction.grossAmount)}</td>
              <td>{money(transaction.commission)}</td>
              <td>{money(transaction.netAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
