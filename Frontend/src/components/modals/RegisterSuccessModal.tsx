import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function RegisterSuccessModal() {
  const { user, closeModal } = useBrisa()
  const navigate = useNavigate()

  function continueToApp() {
    closeModal()
    navigate(user?.role === 'propietario' ? '/propietario' : '/')
  }

  return (
    <Dialog>
      <div className="success">
        <h2>¡Registro exitoso!</h2>
        <p>Tu perfil y tu cuenta bancaria están listos.</p>
      </div>
      <p>Ya tienes una sesión local iniciada en este navegador.</p>
      <Button variant="primary" full onClick={continueToApp}>
        Continuar
      </Button>
    </Dialog>
  )
}
