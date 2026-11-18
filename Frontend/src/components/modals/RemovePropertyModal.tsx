import { useState } from 'react'
import { useBrisa } from '../../context/BrisaContext'
import { money } from '../../domain/brisa'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface RemovePropertyModalProps {
  propertyId: string
}

export function RemovePropertyModal({ propertyId }: RemovePropertyModalProps) {
  const { db, remove, closeModal, showToast } = useBrisa()
  const [submitting, setSubmitting] = useState(false)
  const property = db.properties.find(
    (candidate) => candidate.id === propertyId,
  )

  if (!property) return null

  async function confirm() {
    setSubmitting(true)

    try {
      await remove(propertyId)
      closeModal()
      showToast('Inmueble eliminado')
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : 'Error inesperado',
      )
    } finally {
      setSubmitting(false)
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
      <p>¿Seguro que quieres eliminar este inmueble?</p>
      <div className="row">
        <Button
          variant="primary"
          onClick={confirm}
          disabled={submitting}
        >
          {submitting ? 'Eliminando...' : 'Quitar'}
        </Button>
        <Button onClick={closeModal}>Cancelar</Button>
      </div>
    </Dialog>
  )
}
