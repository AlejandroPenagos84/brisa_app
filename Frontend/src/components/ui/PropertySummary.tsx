import { money } from '../../domain/brisa'
import { useBrisa } from '../../context/BrisaContext'
import type { Booking, Quote } from '../../types'

interface PropertySummaryProps {
  data: Quote | Booking
}

export function PropertySummary({ data }: PropertySummaryProps) {
  const { db } = useBrisa()
  const property = db.properties.find(
    (candidate) => candidate.id === data.property,
  )

  if (!property) return null

  const isBooking = 'title' in data
  const title = isBooking ? data.title : property.title
  const photo = isBooking ? data.photo : property.photos[0]

  return (
    <div className="summary">
      <img src={photo} alt={title} />
      <h3>{title}</h3>
      <p>
        {data.start} → {data.end} · {data.guests} huéspedes
      </p>
      <p>
        {money(data.price)} × {data.nights} noches
      </p>
      <hr />
      <div className="row between">
        <strong>Total</strong>
        <strong>{money(data.total)}</strong>
      </div>
    </div>
  )
}
