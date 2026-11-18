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
  const property = db.properties.find(
    (candidate) => candidate.id === id,
  )
  const [draft, setDraft] = useState<ReservationDraft>(() =>
    pendingQuote && pendingQuote.property === id
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
      pendingQuote && pendingQuote.property === id
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
  }, [id])

  if (!property) {
    return <h2>Este inmueble no está disponible</h2>
  }

  const propertyId = property.id
  let quote: Quote | null = null
  let validationMessage = ''

  try {
    quote = quoteFor(
      db,
      propertyId,
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
        {property.location} · {property.capacity}{' '}
        huéspedes
      </p>
      <img
        id="hero"
        className="hero"
        src={heroPhoto || property.photos[0]}
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
          <h2>Acerca de este espacio</h2>
          <p className="muted">
            Anfitrión: {host?.name || 'Anfitrión brisa'}
          </p>
          <p>{property.description}</p>
          <hr />
          <h2>Ubicación</h2>
          <p>{property.address}</p>
          {property.manuallyInactive ? (
            <div className="notice">El anfitrión pausó las nuevas reservas.</div>
          ) : property.status === 'INACTIVE' ? (
            <div className="notice">
              <strong>Este inmueble ya tiene reservas</strong>
              <p>
                Las fechas ocupadas están deshabilitadas. Puedes reservar
                otras fechas disponibles.
              </p>
            </div>
          ) : null}
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
                min={today()}
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
              disabled={property.manuallyInactive}
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
