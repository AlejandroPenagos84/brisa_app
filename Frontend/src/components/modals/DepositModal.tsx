import { useState, type FormEvent } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { TextField } from '../ui/Fields'

export function DepositModal() {
  const { user, deposit, closeModal, showToast } = useBrisa()
  const [accountId, setAccountId] = useState(user?.accounts[0]?.id ?? 0)
  const [amount, setAmount] = useState('1000000')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      deposit(accountId, Number(amount))
      closeModal()
      showToast('Fondos ingresados')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    }
  }

  return (
    <Dialog>
      <h2>Ingresar fondos</h2>
      <p>Saldo de demostración para probar tus reservas.</p>
      <form id="deposit" onSubmit={handleSubmit}>
        <label>
          Cuenta
          <select
            name="account"
            value={accountId}
            onChange={(event) => setAccountId(Number(event.target.value))}
          >
            {user?.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bank} · {account.number.slice(-4)}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Monto en COP"
          name="amount"
          type="number"
          value={amount}
          required
          min={1}
          onChange={(event) => setAmount(event.target.value)}
        />
        {error ? <p className="error">{error}</p> : null}
        <Button variant="primary" full type="submit">
          Ingresar fondos
        </Button>
      </form>
    </Dialog>
  )
}
