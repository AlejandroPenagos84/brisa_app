import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

export function DiscardChangesModal() {
  const { closeModal } = useBrisa()
  const navigate = useNavigate()

  function discard() {
    closeModal()
    navigate('/propietario')
  }

  return (
    <Dialog>
      <h2>¿Descartar cambios?</h2>
      <p>Los cambios sin guardar se perderán.</p>
      <div className="row">
        <Button variant="primary" onClick={discard}>
          Descartar cambios
        </Button>
        <Button onClick={closeModal}>Seguir editando</Button>
      </div>
    </Dialog>
  )
}
