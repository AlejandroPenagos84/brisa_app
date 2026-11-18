import { useEffect, useState } from 'react'
import { money } from '../../domain/brisa'
import { api, type ApiTransaction } from '../../services/api'
import { Button } from './Button'
import { TransactionTable } from './TransactionTable'

export function OwnerEarnings({ ownerId }: { ownerId: string }) {
  const [earnings, setEarnings] = useState<{ total: number; transactions: ApiTransaction[] }>()
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setError('')
    setEarnings(undefined)

    Promise.all([api.getOwnerEarnings(ownerId), api.getOwnerTransactions(ownerId)])
      .then(([result, { transactions }]) => {
        if (active) setEarnings({ total: result.totalEarnings, transactions })
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los ingresos')
        }
      })

    return () => { active = false }
  }, [ownerId, revision])

  return (
    <section>
      <div className="row between">
        <h2>Ingresos por reservas</h2>
        <Button onClick={() => setRevision((value) => value + 1)}>Actualizar ingresos</Button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      {earnings ? (
        <>
          <p>Ingresos netos <strong>{money(earnings.total)}</strong></p>
          <TransactionTable transactions={earnings.transactions} />
        </>
      ) : error ? null : <p className="muted" role="status">Cargando ingresos…</p>}
    </section>
  )
}
