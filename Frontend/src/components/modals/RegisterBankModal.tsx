import { useState, type FormEvent } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import type { AccountInput, RegistrationDraft } from '../../types'
import { AccountFields } from '../forms/AccountFields'
import { EMPTY_ACCOUNT } from '../forms/registration'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface RegisterBankModalProps {
  draft: RegistrationDraft
}

export function RegisterBankModal({ draft }: RegisterBankModalProps) {
  const { register, openModal } = useBrisa()
  const [account, setAccount] = useState<AccountInput>(EMPTY_ACCOUNT)
  const [error, setError] = useState('')

  function update(patch: Partial<AccountInput>) {
    setAccount((current) => ({ ...current, ...patch }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      register(draft, account)
      openModal({ type: 'register-success' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    }
  }

  return (
    <Dialog>
      <p className="eyebrow">REGISTRO · PASO 2 DE 2</p>
      <h2>Registrar cuenta bancaria</h2>
      <p>
        Vincula una cuenta para pagar tus reservas o recibir tus ingresos.
      </p>
      <form id="register-bank" onSubmit={handleSubmit}>
        <AccountFields value={account} onChange={update} />
        {error ? <p className="error">{error}</p> : null}
        <Button variant="primary" full type="submit">
          Registrar cuenta
        </Button>
      </form>
      <Button
        variant="link"
        full
        onClick={() => openModal({ type: 'register', draft })}
      >
        Cancelar · Volver al paso 1
      </Button>
    </Dialog>
  )
}
