import { formatDate, money } from '../../domain/brisa'
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

  const isBooking = 'title' in data
  const title = isBooking ? data.title : property?.title ?? 'Alojamiento'
  const photo = isBooking ? data.photo : property?.photos[0]

  return (
    <div className="summary">
      {photo ? <img src={photo} alt={title} /> : null}
      <h3>{title}</h3>
      <p>
        {formatDate(data.start)} → {formatDate(data.end)} · {data.nights}{' '}
        {data.nights === 1 ? 'noche' : 'noches'}
        {isBooking ? null : ` · ${data.guests} ${data.guests === 1 ? 'huésped' : 'huéspedes'}`}
      </p>
      {isBooking ? null : <p>{money(data.price)} por noche</p>}
      <hr />
      <div className="row between">
        <strong>Total</strong>
        <strong>{money(data.total)}</strong>
      </div>
    </div>
  )
}
