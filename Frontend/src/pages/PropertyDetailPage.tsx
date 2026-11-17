import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { money, quoteFor, today } from '../domain/brisa'
import type { Quote } from '../types'
import { Button } from '../components/ui/Button'
import { Calendar } from '../components/ui/Calendar'
import { TextField } from '../components/ui/Fields'

interface ReservationDraft {
  start: string
  end: string
  guests: number
}

export function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    db,
    user,
    filters,
    pendingQuote,
    requireLogin,
    setPendingQuote,
  } = useBrisa()
  const propertyId = Number(id)
  const property = db.properties.find(
    (candidate) => candidate.id === propertyId,
  )
  const [draft, setDraft] = useState<ReservationDraft>(() =>
    pendingQuote?.property === propertyId
      ? {
          start: pendingQuote.start,
          end: pendingQuote.end,
          guests: pendingQuote.guests,
        }
      : {
          start: filters.start,
          end: filters.end,
          guests: filters.guests,
        },
  )
  const [heroPhoto, setHeroPhoto] = useState(property?.photos[0] ?? '')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setDraft(
      pendingQuote?.property === propertyId
        ? {
            start: pendingQuote.start,
            end: pendingQuote.end,
            guests: pendingQuote.guests,
          }
        : {
            start: filters.start,
            end: filters.end,
            guests: filters.guests,
          },
    )
    setHeroPhoto(property?.photos[0] ?? '')
    setFormError('')
  }, [propertyId])

  if (!property || !property.active) {
    return <h2>Este inmueble no está disponible</h2>
  }

  let quote: Quote | null = null
  let validationMessage = ''

  try {
    quote = quoteFor(
      db,
      property.id,
      draft.start,
      draft.end,
      draft.guests,
    )
  } catch (caught) {
    if (draft.start && draft.end) {
      validationMessage =
        caught instanceof Error ? caught.message : 'Error inesperado'
    }
  }

  const errorMessage = formError || validationMessage
  const host = db.users.find((candidate) => candidate.id === property.owner)
  const minStart = property.from > today() ? property.from : today()

  function selectDate(date: string) {
    setFormError('')

    if (!draft.start || draft.end || date <= draft.start) {
      setDraft({ ...draft, start: date, end: '' })
    } else {
      setDraft({ ...draft, end: date })
    }
  }

  function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    try {
      const nextQuote = quoteFor(
        db,
        propertyId,
        draft.start,
        draft.end,
        draft.guests,
      )
      setPendingQuote(nextQuote)

      if (!requireLogin('payment')) return

      if (user?.role !== 'cliente') {
        throw new Error('Inicia sesión como cliente para reservar')
      }

      navigate('/pago')
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : 'Error inesperado',
      )
    }
  }

  return (
    <>
      <Button variant="link" onClick={() => navigate('/')}>
        ← Volver al catálogo
      </Button>
      <h1>{property.title}</h1>
      <p>
        {property.location || property.address} · {property.capacity}{' '}
        huéspedes
      </p>
      <img
        id="hero"
        className="hero"
        src={heroPhoto}
        alt={property.title}
      />
      <div className="gallery">
        {property.photos.map((url) => (
          <button
            key={url}
            type="button"
            className="gallery-item"
            onClick={() => setHeroPhoto(url)}
            aria-label="Ver foto del alojamiento"
          >
            <img src={url} alt="Foto del alojamiento" />
          </button>
        ))}
      </div>

      <div className="detail">
        <section>
          <h2>{property.type} · Tu próxima pausa</h2>
          <p className="muted">Anfitrión: {host?.name || 'Anfitrión brisa'}</p>
          <hr />
          <h2>Acerca de este espacio</h2>
          <p>{property.description}</p>
          <hr />
          <h2>Ubicación</h2>
          <p>{property.address}</p>
          <div className="notice">
            <strong>Antes de reservar</strong>
            <p>
              Respeta la capacidad del alojamiento. Las fechas ocupadas
              aparecen deshabilitadas.
            </p>
          </div>
        </section>

        <aside className="panel sticky">
          <h2>
            {money(property.price)} <small>/ noche</small>
          </h2>
          <form id="reserve" onSubmit={reserve}>
            <div className="two">
              <TextField
                label="Entrada"
                name="start"
                type="date"
                value={draft.start}
                required
                min={minStart}
                max={property.until}
                onChange={(event) => {
                  setFormError('')
                  setDraft({ ...draft, start: event.target.value })
                }}
              />
              <TextField
                label="Salida"
                name="end"
                type="date"
                value={draft.end}
                required
                min={draft.start || today()}
                max={property.until}
                onChange={(event) => {
                  setFormError('')
                  setDraft({ ...draft, end: event.target.value })
                }}
              />
            </div>
            <TextField
              label="Huéspedes"
              name="guests"
              type="number"
              value={draft.guests}
              min={1}
              max={property.capacity}
              required
              onChange={(event) => {
                setFormError('')
                setDraft({ ...draft, guests: Number(event.target.value) })
              }}
            />
            <Calendar
              property={property}
              start={draft.start}
              end={draft.end}
              onSelect={selectDate}
            />
            {errorMessage ? (
              <p className="error">{errorMessage}</p>
            ) : null}
            {quote ? (
              <>
                <hr />
                <div className="row between">
                  <span>
                    {money(property.price)} × {quote.nights} noches
                  </span>
                  <strong>{money(quote.total)}</strong>
                </div>
              </>
            ) : (
              <p className="muted">
                Selecciona y confirma tus fechas para ver el total.
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              full
              className="booking-button"
            >
              Reservar
            </Button>
            <p className="small muted">
              Todavía no se realizará ningún cobro.
            </p>
          </form>
        </aside>
      </div>
    </>
  )
}
