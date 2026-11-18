import { money, today } from '../../domain/brisa'
import { useBrisa } from '../../context/BrisaContext'
import type { Property } from '../../types'

interface CalendarProps {
  property: Property
  start: string
  end: string
  onSelect: (date: string) => void
}

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function Calendar({ property, start, end, onSelect }: CalendarProps) {
  const { db } = useBrisa()
  const monthStart = new Date(`${start || today()}T12:00:00`)
  monthStart.setDate(1)

  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate()

  const leadingBlanks = (monthStart.getDay() + 6) % 7

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = [
      monthStart.getFullYear(),
      String(monthStart.getMonth() + 1).padStart(2, '0'),
      String(day).padStart(2, '0'),
    ].join('-')

    const blocked =
      date < today() ||
      db.bookings.some(
        (booking) =>
          booking.property === property.id &&
          date >= booking.start &&
          date <= booking.end,
      )

    return { date, day, blocked }
  })

  return (
    <>
      <h3>
        {monthStart.toLocaleDateString('es-CO', {
          month: 'long',
          year: 'numeric',
        })}
      </h3>
      <div className="calendar">
        {WEEK_DAYS.map((weekDay) => (
          <small key={weekDay}>{weekDay}</small>
        ))}
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map(({ date, day, blocked }) => (
          <button
            key={date}
            type="button"
            disabled={blocked}
            className={date === start || date === end ? 'selected' : undefined}
            onClick={() => onSelect(date)}
            aria-label={`${day} de ${monthStart.toLocaleDateString('es-CO', {
              month: 'long',
            })}, ${money(property.price)} por noche`}
          >
            {day}
          </button>
        ))}
      </div>
    </>
  )
}
