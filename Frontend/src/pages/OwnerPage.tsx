import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { isPropertyActive, money } from '../domain/brisa'
import { Button } from '../components/ui/Button'

export function OwnerPage() {
  const { db, user, openModal } = useBrisa()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== 'propietario') {
    return <Navigate to="/" replace />
  }

  const properties = db.properties.filter(
    (property) => property.owner === user.id && property.active,
  )
  const receivedBookings = db.bookings.filter(
    (booking) =>
      db.properties.find((property) => property.id === booking.property)
        ?.owner === user.id,
  )

  function requestRemove(propertyId: number) {
    const property = db.properties.find(
      (candidate) => candidate.id === propertyId,
    )

    if (property && isPropertyActive(db, property)) {
      openModal({ type: 'cannot-remove' })
      return
    }

    openModal({ type: 'remove-property', propertyId })
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
              <p>{money(property.price)} / noche</p>
              <span className="badge">
                {isPropertyActive(db, property)
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
              {booking.start} → {booking.end} · {money(booking.total)}
            </p>
          </div>
        ))
      ) : (
        <p className="muted">Aún no has recibido reservas.</p>
      )}
    </>
  )
}
