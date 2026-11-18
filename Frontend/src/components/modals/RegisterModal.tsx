import { useState, type FormEvent } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import type { RegistrationDraft, Role } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { SelectField, TextField } from '../ui/Fields'

interface RegisterModalProps {
  draft: RegistrationDraft
}

export function RegisterModal({ draft }: RegisterModalProps) {
  const { db, openModal } = useBrisa()
  const [form, setForm] = useState<RegistrationDraft>(draft)
  const [error, setError] = useState('')

  function update(patch: Partial<RegistrationDraft>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function selectRole(role: Role) {
    if (role === 'administrador') return
    update({ role })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const fullName = `${form.name.trim()} ${form.surname.trim()}`
      if (!form.name.trim() || !form.surname.trim() || fullName.length > 100) {
        throw new Error('Ingresa un nombre y apellido de hasta 100 caracteres en total')
      }
      const duplicated = db.users.some(
        (user) => user.email.toLowerCase() === form.email.trim().toLowerCase(),
      )

      if (duplicated) {
        throw new Error('Ya existe una cuenta con estos datos')
      }

      if (form.role === 'cliente' && !form.cityId) {
        throw new Error('Selecciona tu ciudad')
      }

      openModal({ type: 'register-bank', draft: form })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    }
  }

  return (
    <Dialog>
      <p className="eyebrow">REGISTRO · PASO 1 DE 2</p>
      <h2>Crea tu cuenta</h2>
      <div className="row">
        <Button
          className={`role ${form.role === 'cliente' ? 'active' : ''}`}
          onClick={() => selectRole('cliente')}
        >
          Soy cliente
        </Button>
        <Button
          className={`role ${form.role === 'propietario' ? 'active' : ''}`}
          onClick={() => selectRole('propietario')}
        >
          Soy propietario
        </Button>
      </div>
      <form id="register" onSubmit={handleSubmit}>
        <div className="two">
          <TextField
            label="Nombre"
            name="name"
            value={form.name}
            required
            onChange={(event) => update({ name: event.target.value })}
          />
          <TextField
            label="Apellido"
            name="surname"
            value={form.surname}
            required
            onChange={(event) => update({ surname: event.target.value })}
          />
        </div>
        <TextField
          label="Correo"
          name="email"
          type="email"
          value={form.email}
          maxLength={150}
          required
          onChange={(event) => update({ email: event.target.value })}
        />
        <TextField
          label="Teléfono"
          name="phone"
          type="tel"
          value={form.phone}
          maxLength={20}
          required
          onChange={(event) => update({ phone: event.target.value })}
        />
        {form.role === 'cliente' ? (
          <SelectField
            label="Ciudad"
            name="city"
            value={form.cityId}
            required
            options={[
              { value: '', label: 'Selecciona una ciudad' },
              ...db.cities.map((city) => ({
                value: city.id,
                label: city.name,
              })),
            ]}
            onChange={(event) => update({ cityId: event.target.value })}
          />
        ) : null}
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          required
          minLength={6}
          autoComplete="new-password"
          onChange={(event) => update({ password: event.target.value })}
        />
        <small>Usa al menos 6 caracteres.</small>
        {error ? <p className="error">{error}</p> : null}
        <Button variant="primary" full type="submit">
          Continuar
        </Button>
      </form>
      <Button
        variant="link"
        full
        onClick={() => openModal({ type: 'login' })}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </Dialog>
  )
}
