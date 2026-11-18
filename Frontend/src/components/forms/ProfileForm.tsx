import { useState, type FormEvent } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import { isValidAccountNumber } from '../../domain/brisa'
import type { AccountInput, User } from '../../types'
import { Button } from '../ui/Button'
import { SelectField, TextField } from '../ui/Fields'
import { AccountFields } from './AccountFields'

export function ProfileForm({ user, onClose }: { user: User; onClose: () => void }) {
  const { db, updateProfile, showToast } = useBrisa()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [email, setEmail] = useState(user.email)
  const [cityId, setCityId] = useState(user.cityId ?? '')
  const originalNumber = user.accounts[0]?.number ?? ''
  const [account, setAccount] = useState<AccountInput>(() => ({
    bankId: user.accounts[0]?.bankId ?? '',
    type: user.accounts[0]?.type ?? 'Ahorros',
    number: originalNumber,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    // Accounts registered before the format existed are kept unless changed
    if (account.number !== originalNumber && !isValidAccountNumber(account.number)) {
      setError('El número de cuenta debe tener el formato XXXX-XXXX-XXXX-XXXX')
      return
    }

    setSaving(true)

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email,
        cityId: user.role === 'cliente' ? cityId : undefined,
        bankId: account.bankId,
        accountNumber: account.number.trim(),
        accountType: account.type,
      })
      showToast('Datos de la cuenta actualizados')
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la cuenta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Editar datos de la cuenta</h2>
      <TextField label="Nombre completo" name="name" value={name} required maxLength={100}
        onChange={(event) => setName(event.target.value)} />
      <TextField label="Correo" name="email" type="email" value={email} required maxLength={150}
        onChange={(event) => setEmail(event.target.value)} />
      <TextField label="Teléfono" name="phone" type="tel" value={phone} required maxLength={20}
        onChange={(event) => setPhone(event.target.value)} />
      {user.role === 'cliente' ? (
        <SelectField label="Ciudad" name="city" required value={cityId}
          options={db.cities.map((city) => ({ value: city.id, label: city.name }))}
          onChange={(event) => setCityId(event.target.value)} />
      ) : null}
      <AccountFields
        value={account}
        requireFormat={account.number !== originalNumber}
        onChange={(patch) => setAccount((current) => ({ ...current, ...patch }))}
      />
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="row">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
      </div>
    </form>
  )
}
