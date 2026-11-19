import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { PropertyImage } from '../../types'
import { Button } from '../ui/Button'

// Same limits as the API (backend: MAX_PROPERTY_IMAGES, MAX_IMAGE_SIZE_BYTES)
export const MAX_PROPERTY_IMAGES = 10
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface PropertyImagesFieldProps {
  // Images already saved in the API
  existing: PropertyImage[]
  removedIds: string[]
  newFiles: File[]
  onChange: (removedIds: string[], newFiles: File[]) => void
  disabled?: boolean
}

interface Tile {
  key: string
  url: string
  remove: () => void
}

// Nothing is sent until the form is saved: the parent keeps the images to
// remove and the files to upload
export function PropertyImagesField({
  existing,
  removedIds,
  newFiles,
  onChange,
  disabled = false,
}: PropertyImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const previews = useMemo(
    () => newFiles.map((file) => URL.createObjectURL(file)),
    [newFiles],
  )
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  )

  const kept = existing.filter((image) => !removedIds.includes(image.id))
  const total = kept.length + newFiles.length
  const tiles: Tile[] = [
    ...kept.map((image) => ({
      key: image.id,
      url: image.url,
      remove: () => onChange([...removedIds, image.id], newFiles),
    })),
    ...newFiles.map((file, index) => ({
      key: `new-${index}-${file.name}`,
      url: previews[index],
      remove: () =>
        onChange(
          removedIds,
          newFiles.filter((_, candidate) => candidate !== index),
        ),
    })),
  ]

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    setError('')

    const rejected: string[] = []
    const accepted = selected.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} no es JPG, PNG o WebP`)
        return false
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        rejected.push(`${file.name} supera 5 MB`)
        return false
      }
      return true
    })

    const room = MAX_PROPERTY_IMAGES - total
    if (accepted.length > room) {
      rejected.push(`Solo puedes agregar ${room} imagen${room === 1 ? '' : 'es'} más`)
    }

    if (rejected.length) setError(rejected.join('. '))
    if (room > 0 && accepted.length) {
      onChange(removedIds, [...newFiles, ...accepted.slice(0, room)])
    }
  }

  return (
    <div className="image-field">
      <span className="image-field-label">Fotos</span>
      <p className="small muted">
        JPG, PNG o WebP, hasta 5 MB cada una y máximo {MAX_PROPERTY_IMAGES}.
        La primera es la portada.
      </p>
      {tiles.length ? (
        <ul className="image-grid">
          {tiles.map((tile, index) => (
            <li key={tile.key} className="image-tile">
              <img src={tile.url} alt={`Foto ${index + 1} del inmueble`} />
              {index === 0 ? <span className="image-badge">Portada</span> : null}
              <button
                type="button"
                className="image-remove"
                onClick={tile.remove}
                disabled={disabled}
                aria-label={`Quitar foto ${index + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted">
          Sin fotos: se mostrará una imagen de referencia de la ciudad.
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        hidden
        onChange={handleFiles}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || total >= MAX_PROPERTY_IMAGES}
      >
        Agregar fotos ({total}/{MAX_PROPERTY_IMAGES})
      </Button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}
