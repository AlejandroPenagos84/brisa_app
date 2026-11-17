import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { DEMO_CREDENTIALS } from '../../data/seed'
import type { LoginTarget } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { TextField } from '../ui/Fields'
import { emptyRegistration } from '../forms/registration'

interface LoginModalProps {
  next?: LoginTarget
}

export function LoginModal({ next }: LoginModalProps) {
  const {
    login,
    closeModal,
    openModal,
    setFilters,
    showToast,
  } = useBrisa()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const user = login(email, password)
      closeModal()

      if (next === 'payment' && user.role === 'cliente') {
        navigate('/pago')
      } else if (next === 'payment') {
        navigate('/propietario')
        showToast('Para reservar, inicia sesión con una cuenta de cliente')
      } else if (next === 'favorites') {
        setFilters({ favorites: true })
        navigate('/')
      } else if (next === 'owner') {
        navigate('/propietario')
      } else if (next === 'bookings') {
        navigate('/reservas')
      } else if (next === 'wallet') {
        navigate('/cuenta')
      } else {
        navigate(user.role === 'propietario' ? '/propietario' : '/')
      }

      showToast(`Bienvenido, ${user.name}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    }
  }

  return (
    <Dialog>
      <h2>Iniciar sesión</h2>
      <p>Bienvenido de nuevo a brisa.</p>
      <form id="login" onSubmit={handleSubmit}>
        <TextField
          label="Correo"
          name="email"
          type="email"
          value={email}
          required
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          required
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />
        <label className="row checkbox">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
          />
          Mostrar contraseña
        </label>
        {error ? <p className="error">{error}</p> : null}
        <Button variant="primary" full type="submit">
          Iniciar sesión
        </Button>
      </form>
      <Button
        variant="link"
        full
        onClick={() => openModal({ type: 'register', draft: emptyRegistration() })}
      >
        ¿No tienes cuenta? Regístrate
      </Button>
      <details>
        <summary>Cuentas para explorar la demo</summary>
        <p>
          Cliente: {DEMO_CREDENTIALS.client}
          <br />
          Propietario: {DEMO_CREDENTIALS.owner}
          <br />
          Contraseña: {DEMO_CREDENTIALS.password}
        </p>
      </details>
    </Dialog>
  )
}
