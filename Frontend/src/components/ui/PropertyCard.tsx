import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { money } from '../../domain/brisa'
import type { Property } from '../../types'

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { user, requireLogin, toggleFavorite } = useBrisa()
  const navigate = useNavigate()
  const isFavorite = user?.favorites.includes(property.id) ?? false

  function openProperty() {
    navigate(`/alojamiento/${property.id}`)
  }

  function handleFavorite() {
    if (!requireLogin('favorites')) return
    toggleFavorite(property.id)
  }

  return (
    <article className="card">
      <button type="button" className="open" onClick={openProperty}>
        <img
          className="cover"
          src={property.photos[0]}
          alt={property.title}
        />
        <h3>
          {property.title}{' '}
          <span style={{ float: 'right', fontSize: 12 }}>★ 4,96</span>
        </h3>
        <p>{property.location || property.address}</p>
        <p className="muted small">
          {property.capacity} huéspedes · {property.type}
        </p>
        <p>
          <strong>{money(property.price)}</strong>{' '}
          <small>COP / noche</small>
        </p>
      </button>
      <span className="badge">{property.type}</span>
      <button
        type="button"
        className="favorite"
        aria-label={`Guardar ${property.title}`}
        onClick={handleFavorite}
      >
        {isFavorite ? '♥' : '♡'}
      </button>
    </article>
  )
}
