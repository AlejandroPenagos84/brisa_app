import { useBrisa } from '../../context/BrisaContext'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function InsufficientFundsModal() {
  const { closeModal, openModal } = useBrisa()

  return (
    <Dialog>
      <h2>Saldo insuficiente</h2>
      <p>No se realizó ningún cobro. Elige otra cuenta o ingresa fondos.</p>
      <Button full onClick={closeModal}>
        Cambiar de cuenta
      </Button>
      <Button
        variant="primary"
        full
        onClick={() => openModal({ type: 'deposit' })}
      >
        Ingresar fondos
      </Button>
    </Dialog>
  )
}
