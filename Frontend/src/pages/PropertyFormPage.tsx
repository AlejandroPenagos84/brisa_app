import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import type { PropertyFormValues, PropertyInput } from '../types'
import { Button } from '../components/ui/Button'
import { SelectField, TextField } from '../components/ui/Fields'
import { PropertyImagesField } from '../components/forms/PropertyImagesField'

export function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { db, user, publish, syncPropertyImages, openModal, showToast } =
    useBrisa()
  const existing = id
    ? db.properties.find((property) => property.id === id)
    : undefined
  const [form, setForm] = useState<PropertyFormValues>(() => ({
    cityId: existing?.cityId ?? db.cities[0]?.id ?? '',
    address: existing?.address ?? '',
    area: existing ? String(existing.area) : '',
    numberOfRooms: existing ? String(existing.numberOfRooms) : '1',
    capacity: existing ? String(existing.capacity) : '1',
    price: existing ? String(existing.price) : '',
  }))
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user || user.role !== 'propietario') {
    return <Navigate to="/" replace />
  }

  if (id && (!existing || existing.owner !== user.id)) {
    return <Navigate to="/propietario" replace />
  }

  function update(patch: Partial<PropertyFormValues>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const data: PropertyInput = {
      cityId: form.cityId,
      address: form.address.trim(),
      area: Number(form.area),
      numberOfRooms: Number(form.numberOfRooms),
      capacity: Number(form.capacity),
      price: Number(form.price),
    }

    if (
      !data.cityId ||
      !data.address ||
      !Number.isFinite(data.area) ||
      data.area <= 0 ||
      !Number.isInteger(data.numberOfRooms) ||
      data.numberOfRooms < 0 ||
      !Number.isInteger(data.capacity) ||
      data.capacity < 1 ||
      !Number.isFinite(data.price) ||
      data.price <= 0
    ) {
      setError('Corrige los campos marcados')
      setSubmitting(false)
      return
    }

    try {
      const saved = await publish(data, existing?.id)
      // The property already exists here; a failed image does not undo it
      const failures = await syncPropertyImages(
        saved.id,
        removedImageIds,
        newImages,
      )
      navigate('/propietario')
      const done = existing ? 'Cambios guardados' : 'Inmueble publicado'
      showToast(
        failures.length
          ? `${done}, pero algunas fotos fallaron: ${failures.join('. ')}`
          : done,
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
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
          label="Dirección"
          name="address"
          value={form.address}
          required
          maxLength={200}
          onChange={(event) => update({ address: event.target.value })}
        />
        <SelectField
          label="Ciudad"
          name="city"
          value={form.cityId}
          required
          disabled={Boolean(existing)}
          options={db.cities.map((city) => ({
            value: city.id,
            label: city.name,
          }))}
          onChange={(event) => update({ cityId: event.target.value })}
        />
        {existing ? (
          <p className="small muted">
            La ciudad no se puede cambiar desde la edición del inmueble.
          </p>
        ) : null}
        <div className="two">
          <TextField
            label="Área en m²"
            name="area"
            type="number"
            value={form.area}
            min={0.01}
            max={99_999_999.99}
            step="0.01"
            required
            onChange={(event) => update({ area: event.target.value })}
          />
          <TextField
            label="Habitaciones"
            name="numberOfRooms"
            type="number"
            value={form.numberOfRooms}
            min={0}
            max={2_147_483_647}
            required
            onChange={(event) =>
              update({ numberOfRooms: event.target.value })
            }
          />
        </div>
        <div className="two">
          <TextField
            label="Capacidad"
            name="capacity"
            type="number"
            value={form.capacity}
            min={1}
            max={2_147_483_647}
            required
            onChange={(event) => update({ capacity: event.target.value })}
          />
          <TextField
            label="Precio por noche (COP)"
            name="price"
            type="number"
            value={form.price}
            min={0.01}
            max={9_999_999_999.99}
            step="0.01"
            required
            onChange={(event) => update({ price: event.target.value })}
          />
        </div>
        <PropertyImagesField
          existing={existing?.images ?? []}
          removedIds={removedImageIds}
          newFiles={newImages}
          disabled={submitting}
          onChange={(removedIds, files) => {
            setRemovedImageIds(removedIds)
            setNewImages(files)
          }}
        />
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting
              ? 'Guardando...'
              : existing
                ? 'Guardar cambios'
                : 'Publicar'}
          </Button>
          <Button onClick={() => openModal({ type: 'discard-changes' })}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  )
}
