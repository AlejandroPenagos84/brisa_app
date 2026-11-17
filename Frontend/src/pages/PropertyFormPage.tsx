import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import {
  isPropertyActive,
  MAX_PHOTO_SIZE,
  PROPERTY_TYPES,
  today,
} from '../domain/brisa'
import type {
  PropertyFormValues,
  PropertyInput,
  PropertyType,
} from '../types'
import { Button } from '../components/ui/Button'
import {
  SelectField,
  TextAreaField,
  TextField,
} from '../components/ui/Fields'

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { db, user, publish, openModal, showToast } = useBrisa()
  const propertyId = id ? Number(id) : undefined
  const existing = propertyId
    ? db.properties.find((property) => property.id === propertyId)
    : undefined
  const [form, setForm] = useState<PropertyFormValues>(() => ({
    title: existing?.title ?? '',
    address: existing?.address ?? '',
    location: existing?.location ?? '',
    type: existing?.type ?? 'Casa',
    description: existing?.description ?? '',
    capacity: existing ? String(existing.capacity) : '1',
    price: existing ? String(existing.price) : '',
    from: existing?.from ?? today(),
    until: existing?.until ?? '2030-12-31',
  }))
  const [photos, setPhotos] = useState<string[]>(
    existing ? [...existing.photos] : [],
  )
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user || user.role !== 'propietario') {
    return <Navigate to="/" replace />
  }

  if (propertyId && (!existing || existing.owner !== user.id)) {
    return <Navigate to="/propietario" replace />
  }

  const locked = Boolean(existing && isPropertyActive(db, existing))

  function update(patch: Partial<PropertyFormValues>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  async function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const files = Array.from(input.files ?? [])

    if (!files.length) return

    if (
      files.some(
        (file) =>
          !file.type.startsWith('image/') || file.size > MAX_PHOTO_SIZE,
      )
    ) {
      setError('Selecciona imágenes de hasta 10 MB')
      input.value = ''
      return
    }

    try {
      const urls = await Promise.all(files.map(readFile))
      setPhotos((current) => [...current, ...urls])
      setError('')
    } catch {
      setError('No se pudieron cargar las imágenes')
    }

    input.value = ''
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const data: PropertyInput = {
      title: form.title,
      address: locked && existing ? existing.address : form.address,
      location: form.location,
      type: locked && existing ? existing.type : form.type,
      description: form.description,
      capacity: Number(form.capacity),
      price: Number(form.price),
      photos,
      from: form.from,
      until: form.until,
    }

    try {
      publish(data, existing?.id)
      navigate('/propietario')
      showToast(existing ? 'Cambios guardados' : 'Inmueble publicado')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    }
  }

  return (
    <section className="narrow">
      <Button variant="link" onClick={() => navigate('/propietario')}>
        ← Mis inmuebles
      </Button>
      <h1>
        {existing ? 'Modificar inmueble' : 'Poner inmueble en renta'}
      </h1>
      {existing ? (
        <div className="notice">
          Los cambios aplican solo a nuevas reservas.
        </div>
      ) : null}
      <form id="property" className="panel" onSubmit={handleSubmit}>
        <TextField
          label="Nombre del alojamiento"
          name="title"
          value={form.title}
          required
          onChange={(event) => update({ title: event.target.value })}
        />
        <TextField
          label="Dirección"
          name="address"
          value={form.address}
          required
          disabled={locked}
          title={
            locked
              ? 'No se puede modificar con reservas vigentes o futuras'
              : undefined
          }
          onChange={(event) => update({ address: event.target.value })}
        />
        {locked ? (
          <p className="small muted">
            No se puede modificar con reservas vigentes o futuras.
          </p>
        ) : null}
        <TextField
          label="Ciudad / ubicación"
          name="location"
          value={form.location}
          required
          onChange={(event) => update({ location: event.target.value })}
        />
        <SelectField
          label="Tipo de inmueble"
          name="type"
          options={PROPERTY_TYPES}
          value={form.type}
          disabled={locked}
          onChange={(event) =>
            update({ type: event.target.value as PropertyType })
          }
        />
        <TextAreaField
          label="Descripción"
          name="description"
          value={form.description}
          required
          onChange={(event) => update({ description: event.target.value })}
        />
        <div className="two">
          <TextField
            label="Capacidad"
            name="capacity"
            type="number"
            value={form.capacity}
            min={1}
            max={30}
            required
            onChange={(event) => update({ capacity: event.target.value })}
          />
          <TextField
            label="Precio por día (COP)"
            name="price"
            type="number"
            value={form.price}
            min={1}
            required
            onChange={(event) => update({ price: event.target.value })}
          />
        </div>
        <h3>Disponibilidad</h3>
        <div className="two">
          <TextField
            label="Disponible desde"
            name="from"
            type="date"
            value={form.from}
            required
            onChange={(event) => update({ from: event.target.value })}
          />
          <TextField
            label="Disponible hasta"
            name="until"
            type="date"
            value={form.until}
            required
            onChange={(event) => update({ until: event.target.value })}
          />
        </div>
        <label>
          Cargar fotos
          <input
            ref={fileInputRef}
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
          />
        </label>
        <div className="gallery" id="photo-preview">
          {photos.map((url, index) => (
            <img
              key={`${url.slice(0, 32)}-${index}`}
              src={url}
              alt="Foto cargada"
            />
          ))}
        </div>
        <p className="small muted">
          Las fotos se conservan en memoria durante esta sesión.
        </p>
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          <Button variant="primary" type="submit">
            {existing ? 'Guardar cambios' : 'Publicar'}
          </Button>
          <Button onClick={() => openModal({ type: 'discard-changes' })}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  )
}
