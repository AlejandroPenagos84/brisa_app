import { useBrisa } from '../../context/BrisaContext'
import { money } from '../../domain/brisa'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface RemovePropertyModalProps {
  propertyId: number
}

export function RemovePropertyModal({ propertyId }: RemovePropertyModalProps) {
  const { db, remove, closeModal, showToast } = useBrisa()
  const property = db.properties.find(
    (candidate) => candidate.id === propertyId,
  )

  if (!property) return null

  function confirm() {
    try {
      remove(propertyId)
      closeModal()
      showToast('Inmueble quitado de renta')
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : 'Error inesperado',
      )
    }
  }

  return (
    <Dialog>
      <h2>Quitar de renta</h2>
      <img
        className="hero confirm-image"
        src={property.photos[0]}
        alt={property.title}
      />
      <h3>{property.title}</h3>
      <p>{money(property.price)} / noche</p>
      <p>¿Seguro que quieres quitar este inmueble de renta?</p>
      <div className="row">
        <Button variant="primary" onClick={confirm}>
          Quitar
        </Button>
        <Button onClick={closeModal}>Cancelar</Button>
      </div>
    </Dialog>
  )
}
