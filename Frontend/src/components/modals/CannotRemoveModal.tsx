import { useBrisa } from '../../context/BrisaContext'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function CannotRemoveModal() {
  const { closeModal } = useBrisa()

  return (
    <Dialog>
      <h2>No se puede quitar de renta</h2>
      <p className="error">
        No puedes quitar este inmueble porque tiene reservas vigentes o
        futuras
      </p>
      <Button full onClick={closeModal}>
        Entendido
      </Button>
    </Dialog>
  )
}
