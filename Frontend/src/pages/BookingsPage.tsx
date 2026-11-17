import { Navigate, useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { Button } from '../components/ui/Button'
import { PropertySummary } from '../components/ui/PropertySummary'

export function BookingsPage() {
  const { db, user } = useBrisa()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/" replace />
  }

  const bookings = db.bookings.filter(
    (booking) => booking.user === user.id,
  )

  return (
    <>
      <h1>Mis reservas</h1>
      {bookings.length ? (
        bookings.map((booking) => (
          <div className="panel narrow booking-card" key={booking.id}>
            <PropertySummary data={booking} />
            <p className="success">Reserva confirmada · #{booking.id}</p>
          </div>
        ))
      ) : (
        <div className="empty">
          <h2>Aún no tienes reservas</h2>
          <p>Tu próxima escapada te espera.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Explorar alojamientos
          </Button>
        </div>
      )}
    </>
  )
}
