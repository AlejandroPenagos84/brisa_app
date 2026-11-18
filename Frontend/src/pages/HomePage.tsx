import { useEffect, useState, type FormEvent } from 'react'
import { useBrisa } from '../context/BrisaContext'
import { filterCatalog, today } from '../domain/brisa'
import type { Filters, SearchForm } from '../types'
import { Button } from '../components/ui/Button'
import { StepperField, TextField } from '../components/ui/Fields'
import { PropertyCard } from '../components/ui/PropertyCard'

export function HomePage() {
  const {
    db,
    user,
    filters,
    setFilters,
    resetFilters,
    loading,
    error,
    refresh,
    showToast,
  } = useBrisa()
  const [searchForm, setSearchForm] = useState<SearchForm>({
    q: filters.q,
    start: filters.start,
    end: filters.end,
    guests: filters.guests,
  })

  useEffect(() => {
    setSearchForm({
      q: filters.q,
      start: filters.start,
      end: filters.end,
      guests: filters.guests,
    })
  }, [filters.q, filters.start, filters.end, filters.guests])

  const list = filterCatalog(db, filters, user?.id)

  function updateForm(patch: Partial<SearchForm>) {
    setSearchForm((current) => ({ ...current, ...patch }))
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (searchForm.start && searchForm.end && searchForm.end <= searchForm.start) {
      showToast('La salida debe ser posterior a la entrada')
      return
    }

    setFilters({ ...searchForm })
  }

  function clearFilters() {
    resetFilters()
    setSearchForm({
      q: '',
      start: '',
      end: '',
      guests: 1,
    })
  }

  return (
    <>
      <p className="eyebrow">LUGARES PARA DESCONECTAR</p>
      <h1>
        {filters.favorites
          ? 'Tus lugares favoritos'
          : 'Encuentra tu próxima pausa.'}
      </h1>
      <p className="muted">
        Casas, cabañas y rincones especiales. Unos días para sentirte en
        casa.
      </p>

      <form id="search" className="search" onSubmit={handleSearch}>
        <TextField
          label="Destino o palabra clave"
          name="q"
          type="search"
          value={searchForm.q}
          placeholder="Explora Colombia"
          onChange={(event) => updateForm({ q: event.target.value })}
        />
        <TextField
          label="Entrada"
          name="start"
          type="date"
          value={searchForm.start}
          min={today()}
          onChange={(event) => updateForm({ start: event.target.value })}
        />
        <TextField
          label="Salida"
          name="end"
          type="date"
          value={searchForm.end}
          min={searchForm.start || today()}
          onChange={(event) => updateForm({ end: event.target.value })}
        />
        <StepperField
          label="Huéspedes"
          name="guests"
          value={searchForm.guests}
          min={1}
          max={30}
          onChange={(guests) => updateForm({ guests })}
        />
        <Button type="submit" variant="primary">
          Buscar
        </Button>
      </form>

      <div className="row filters">
        <label>
          Ciudad
          <select
            id="filter-city"
            value={filters.cityId}
            onChange={(event) =>
              setFilters({ cityId: event.target.value })
            }
          >
            <option value="">Todas</option>
            {db.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Precio máximo por noche
          <input
            id="filter-max"
            type="number"
            min={0}
            value={filters.max}
            placeholder="Sin límite"
            onChange={(event) => setFilters({ max: event.target.value })}
          />
        </label>
        <label>
          Ordenar
          <select
            id="sort"
            value={filters.sort}
            onChange={(event) =>
              setFilters({
                sort: event.target.value as Filters['sort'],
              })
            }
          >
            <option value="recommended">Recomendados</option>
            <option value="price">Menor precio</option>
          </select>
        </label>
        <Button variant="link" onClick={clearFilters}>
          Limpiar filtros
        </Button>
      </div>

      <div className="row between">
        <div>
          <h2>Estancias que inspiran</h2>
          <p className="muted small">
            {loading
              ? 'Cargando inmuebles...'
              : `${list.length} espacios para tu próxima escapada`}
          </p>
        </div>
      </div>

      {error ? (
        <div className="notice">
          <strong>No se pudo cargar el catálogo</strong>
          <p>{error}</p>
          <Button onClick={() => void refresh()}>Reintentar</Button>
        </div>
      ) : null}

      <div className="grid" id="results">
        {list.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {!loading && !error && !list.length ? (
        <div className="empty">
          <h2>⌕</h2>
          <h2>No hay inmuebles que coincidan con tu búsqueda</h2>
          <Button onClick={clearFilters}>Limpiar filtros</Button>
        </div>
      ) : null}

      <div className="notice">
        <strong>Viaja con calma. Te acompañamos.</strong>
        <p className="muted">
          Alojamientos verificados, precios claros y ayuda cuando la
          necesites.
        </p>
      </div>
    </>
  )
}
