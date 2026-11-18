import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { formatDate, isPropertyActive, money, rentalStatusLabels } from '../domain/brisa'
import type { Property } from '../types'
import { Button } from '../components/ui/Button'
import { OwnerEarnings } from '../components/ui/OwnerEarnings'

export function OwnerPage() {
  const { db, user, openModal, setPropertyStatus, showToast } = useBrisa()
  const navigate = useNavigate()
  const [updating, setUpdating] = useState(false)

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== 'propietario') {
    return <Navigate to="/" replace />
  }

  const properties = db.properties.filter(
    (property) => property.owner === user.id,
  )
  const receivedBookings = db.bookings.filter(
    (booking) =>
      db.properties.find((property) => property.id === booking.property)
        ?.owner === user.id,
  )

  function requestRemove(propertyId: string) {
    const property = db.properties.find(
      (candidate) => candidate.id === propertyId,
    )

    if (property && isPropertyActive(db, property)) {
      openModal({ type: 'cannot-remove' })
      return
    }

    openModal({ type: 'remove-property', propertyId })
  }

  async function toggleAvailability(property: Property) {
    setUpdating(true)
    try {
      await setPropertyStatus(property.id, property.manuallyInactive ? 'ACTIVE' : 'INACTIVE')
      showToast(property.manuallyInactive ? 'Inmueble reactivado' : 'Nuevas reservas pausadas')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'No se pudo actualizar el inmueble')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <div className="row between">
        <div>
          <p className="eyebrow">TU ESPACIO EN BRISA</p>
          <h1>Mis inmuebles</h1>
          <p className="muted">
            Administra tus espacios y recibe nuevas historias.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/propietario/nuevo')}
        >
          Poner inmueble en renta
        </Button>
      </div>

      {properties.length ? (
        properties.map((property) => (
          <article className="item" key={property.id}>
            <img src={property.photos[0]} alt={property.title} />
            <div>
              <h3>{property.title}</h3>
              <p>
                {property.location} · {money(property.price)} / noche
              </p>
              <p className="muted small">
                {property.numberOfRooms}{' '}
                {property.numberOfRooms === 1 ? 'habitación' : 'habitaciones'} ·{' '}
                {property.capacity}{' '}
                {property.capacity === 1 ? 'huésped' : 'huéspedes'} ·{' '}
                {property.area} m²
              </p>
              <span className="badge">
                {property.manuallyInactive ? 'Pausado' : isPropertyActive(db, property)
                  ? 'Con reservas'
                  : 'Disponible'}
              </span>
            </div>
            <div className="row">
              <Button
                onClick={() =>
                  navigate(`/propietario/${property.id}/editar`)
                }
              >
                Modificar
              </Button>
              <Button disabled={updating || (property.manuallyInactive && isPropertyActive(db, property))}
                onClick={() => void toggleAvailability(property)}>
                {property.manuallyInactive ? 'Reactivar' : 'Pausar reservas'}
              </Button>
              <Button onClick={() => requestRemove(property.id)}>
                Quitar de renta
              </Button>
            </div>
          </article>
        ))
      ) : (
        <div className="empty">
          <h2>No tienes inmuebles en renta</h2>
          <p>Comparte ese lugar especial con tu próximo huésped.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/propietario/nuevo')}
          >
            Poner inmueble en renta
          </Button>
        </div>
      )}

      <h2>Reservas recibidas</h2>
      {receivedBookings.length ? (
        receivedBookings.map((booking) => (
          <div className="notice" key={booking.id}>
            <strong>{booking.title}</strong>
            <p>
              {formatDate(booking.start)} → {formatDate(booking.end)} · {money(booking.total)} ·{' '}
              {rentalStatusLabels[booking.status]}
            </p>
          </div>
        ))
      ) : (
        <p className="muted">Aún no has recibido reservas.</p>
      )}
      <OwnerEarnings key={user.id} ownerId={user.id} />
    </>
  )
}
