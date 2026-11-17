import { useBrisa } from '../../context/BrisaContext'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function RegisterSuccessModal() {
  const { openModal } = useBrisa()

  return (
    <Dialog>
      <div className="success">
        <h2>¡Registro exitoso!</h2>
        <p>Tu perfil y tu cuenta bancaria están listos.</p>
      </div>
      <p>Inicia sesión con los datos que acabas de registrar.</p>
      <Button
        variant="primary"
        full
        onClick={() => openModal({ type: 'login' })}
      >
        Continuar e iniciar sesión
      </Button>
    </Dialog>
  )
}
