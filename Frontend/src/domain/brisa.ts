import type {
  DbState,
  Filters,
  Property,
  Quote,
  RegistrationDraft,
  RentalStatus,
  Role,
} from '../types'

export function money(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// Same rate and rounding as the backend (Administrator.COMMISSION_RATE):
// the commission is rounded to the nearest cent and Brisa keeps it when a
// rental is cancelled
export const COMMISSION_RATE = 0.1

export function refundFor(total: number): number {
  const totalInCents = Math.round(total * 100)
  const commissionInCents = Math.round(totalInCents * COMMISSION_RATE)
  return (totalInCents - commissionInCents) / 100
}

export function today(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: import.meta.env.VITE_APP_TIME_ZONE || 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
}

export const ACCOUNT_NUMBER_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{4}$/
export const ACCOUNT_NUMBER_LENGTH = 19

// Keeps only digits (max 16) and inserts a "-" every 4 digits:
// "1234567890" -> "1234-5678-90"
export function formatAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.match(/.{1,4}/g)?.join('-') ?? ''
}

export function isValidAccountNumber(value: string): boolean {
  return ACCOUNT_NUMBER_PATTERN.test(value)
}

export const PHONE_DIGITS = 10
// Formatted length: "333 333 3333"
export const PHONE_LENGTH = 12

// Keeps only digits (max 10): "3a3 33-33333" -> "33333333"
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_DIGITS)
}

// Groups the digits as 3-3-4: "3333333333" -> "333 333 3333"
export function formatPhone(value: string): string {
  const digits = phoneDigits(value)
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
    .filter(Boolean)
    .join(' ')
}

export function isValidPhone(value: string): boolean {
  return /^\d{10}$/.test(value.replace(/\s/g, ''))
}

export function createDefaultFilters(): Filters {
  return {
    q: '',
    start: '',
    end: '',
    guests: 1,
    cityId: '',
    max: '',
    favorites: false,
    sort: 'recommended',
  }
}

export function createRegistrationDraft(
  role: RegistrationDraft['role'] = 'cliente',
): RegistrationDraft {
  return {
    role,
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    cityId: '',
  }
}

export function findProperty(
  db: DbState,
  propertyId: string,
): Property | undefined {
  return db.properties.find((property) => property.id === propertyId)
}

export function isPropertyActive(db: DbState, property: Property): boolean {
  return db.bookings.some(
    (booking) =>
      booking.property === property.id && booking.end >= today(),
  )
}

export function quoteFor(
  db: DbState,
  propertyId: string,
  start: string,
  end: string,
  guests = 1,
): Quote {
  const property = findProperty(db, propertyId)

  if (!property || property.manuallyInactive) {
    throw new Error('Este inmueble no está disponible')
  }

  if (!start || !end || start < today() || end <= start) {
    throw new Error('Selecciona y confirma tus fechas')
  }

  const overlapping = db.bookings.some(
    (booking) =>
      booking.property === property.id &&
      start <= booking.end &&
      end >= booking.start,
  )

  if (overlapping) {
    throw new Error('Estas fechas no están disponibles')
  }

  const guestCount = Number(guests)

  if (
    !Number.isInteger(guestCount) ||
    guestCount < 1 ||
    guestCount > property.capacity
  ) {
    throw new Error('Revisa la cantidad de huéspedes')
  }

  const nights = Math.round(
    (Date.parse(end) - Date.parse(start)) / 86_400_000,
  )

  return {
    property: property.id,
    start,
    end,
    guests: guestCount,
    nights,
    total: Math.round(property.price * 100) * nights / 100,
    price: property.price,
  }
}

// Lowercase without accents, so "bogota" finds "Bogotá"
function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function filterCatalog(
  db: DbState,
  filters: Filters,
  userId?: string,
): Property[] {
  const user = db.users.find((candidate) => candidate.id === userId)
  const query = normalizeText(filters.q.trim())
  const maxPrice = Number(filters.max)
  const guests = Number(filters.guests)

  const properties = db.properties.filter((property) => {
    if (property.manuallyInactive) return false

    if (filters.favorites && !user?.favorites.includes(property.id)) {
      return false
    }

    if (filters.cityId && property.cityId !== filters.cityId) {
      return false
    }

    if (filters.max && property.price > maxPrice) {
      return false
    }

    if (
      Number.isFinite(guests) &&
      guests > 0 &&
      property.capacity < guests
    ) {
      return false
    }

    const countryId = db.cities.find((city) => city.id === property.cityId)?.countryId
    const country = db.countries.find((item) => item.id === countryId)?.name ?? ''
    const searchable = normalizeText(
      `${property.address} ${property.location} ${country} ${property.description}`,
    )

    if (!searchable.includes(query)) {
      return false
    }

    if (filters.start && filters.end) {
      try {
        quoteFor(
          db,
          property.id,
          filters.start,
          filters.end,
          filters.guests,
        )
      } catch {
        return false
      }
    }

    return true
  })

  if (filters.sort === 'price') {
    return [...properties].sort((a, b) => a.price - b.price)
  }

  return properties
}

export function userLabel(role: Role): string {
  if (role === 'propietario') return 'Propietario'
  if (role === 'administrador') return 'Administrador'
  return 'Cliente'
}

export const rentalStatusLabels: Record<RentalStatus, string> = {
  UPCOMING: 'Próxima',
  ACTIVE: 'En curso',
  FINISHED: 'Finalizada',
}
