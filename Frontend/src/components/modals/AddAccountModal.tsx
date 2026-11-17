import { useState, type FormEvent } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import type { AccountInput } from '../../types'
import { AccountFields } from '../forms/AccountFields'
import { EMPTY_ACCOUNT } from '../forms/registration'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function AddAccountModal() {
  const { addAccount, closeModal, showToast } = useBrisa()
  const [account, setAccount] = useState<AccountInput>(EMPTY_ACCOUNT)
  const [error, setError] = useState('')

  function update(patch: Partial<AccountInput>) {
    setAccount((current) => ({ ...current, ...patch }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      addAccount(account)
      closeModal()
      showToast('Cuenta registrada')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    }
  }

  return (
    <Dialog>
      <h2>Registrar cuenta bancaria</h2>
      <form id="add-account" onSubmit={handleSubmit}>
        <AccountFields value={account} onChange={update} />
        {error ? <p className="error">{error}</p> : null}
        <Button variant="primary" full type="submit">
          Registrar cuenta
        </Button>
      </form>
    </Dialog>
  )
}
