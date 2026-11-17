import type {
  AccountInput,
  AccountType,
  BankAccount,
  Booking,
  DbState,
  Filters,
  Property,
  PropertyInput,
  PropertyType,
  Quote,
  RegistrationDraft,
  Role,
  User,
} from '../types'

export const BANKS = ['Bancolombia', 'Davivienda', 'Banco de Bogotá'] as const

export const ACCOUNT_TYPES: AccountType[] = ['Ahorros', 'Corriente']

export const PROPERTY_TYPES: PropertyType[] = [
  'Casa',
  'Loft',
  'Cabaña',
  'Apartamento',
]

export const MAX_PHOTO_SIZE = 10 * 1024 * 1024

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const ACCOUNT_NUMBER_PATTERN = /^\d{6,20}$/

export function money(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createDefaultFilters(): Filters {
  return {
    q: '',
    start: '',
    end: '',
    guests: 1,
    type: '',
    max: '',
    favorites: false,
    sort: 'recommended',
  }
}

export function createRegistrationDraft(
  role: Role = 'cliente',
): RegistrationDraft {
  return {
    role,
    name: '',
    surname: '',
    document: '',
    email: '',
    phone: '',
    password: '',
  }
}

export function findProperty(
  db: DbState,
  propertyId: number | string,
): Property | undefined {
  return db.properties.find((property) => property.id === Number(propertyId))
}

export function findUser(
  db: DbState,
  userId: number | string,
): User | undefined {
  return db.users.find((user) => user.id === Number(userId))
}

export function isPropertyActive(db: DbState, property: Property): boolean {
  return db.bookings.some(
    (booking) =>
      booking.property === property.id && booking.end > today(),
  )
}

export function validateAccount(users: User[], account: AccountInput): void {
  if (!BANKS.length) {
    throw new Error('No hay bancos disponibles en este momento')
  }

  const number = account.number.trim()
  const validBank = BANKS.includes(
    account.bank as (typeof BANKS)[number],
  )
  const validType = ACCOUNT_TYPES.includes(account.type)

  if (!validBank || !validType || !ACCOUNT_NUMBER_PATTERN.test(number)) {
    throw new Error('Revisa los datos de la cuenta bancaria')
  }

  const duplicate = users.some((user) =>
    user.accounts.some(
      (bankAccount) =>
        bankAccount.bank === account.bank &&
        bankAccount.number === number,
    ),
  )

  if (duplicate) {
    throw new Error('Esta cuenta ya está registrada')
  }
}

export function loginUser(
  db: DbState,
  email: string,
  password: string,
): User {
  const normalizedEmail = email.trim().toLowerCase()
  const user = db.users.find(
    (candidate) =>
      candidate.email === normalizedEmail && candidate.password === password,
  )

  if (!user) {
    throw new Error('Credenciales incorrectas')
  }

  return user
}

export function createUser(
  db: DbState,
  data: RegistrationDraft,
  account: AccountInput,
): { db: DbState; user: User } {
  const email = data.email.trim().toLowerCase()
  const requiredFields = [
    data.name,
    data.surname,
    data.document,
    data.email,
    data.phone,
    data.password,
  ]

  if (
    !['cliente', 'propietario'].includes(data.role) ||
    requiredFields.some((field) => !field?.trim())
  ) {
    throw new Error('Corrige los campos marcados')
  }

  if (!EMAIL_PATTERN.test(email) || data.password.length < 6) {
    throw new Error(
      'Revisa el correo y usa una contraseña de al menos 6 caracteres',
    )
  }

  const duplicated = db.users.some(
    (user) => user.email === email || user.document === data.document,
  )

  if (duplicated) {
    throw new Error('Ya existe una cuenta con estos datos')
  }

  validateAccount(db.users, account)

  const userId = db.serial + 1
  const accountId = db.serial + 2
  const user: User = {
    ...data,
    email,
    id: userId,
    accounts: [
      {
        ...account,
        number: account.number.trim(),
        id: accountId,
        balance: 0,
      },
    ],
    favorites: [],
  }

  return {
    db: {
      ...db,
      serial: accountId,
      users: [...db.users, user],
    },
    user,
  }
}

export function addAccountToUser(
  db: DbState,
  userId: number,
  account: AccountInput,
): { db: DbState; account: BankAccount } {
  const user = findUser(db, userId)

  if (!user) {
    throw new Error('Inicia sesión para continuar')
  }

  validateAccount(db.users, account)

  const accountId = db.serial + 1
  const bankAccount: BankAccount = {
    ...account,
    number: account.number.trim(),
    id: accountId,
    balance: 0,
  }

  return {
    db: {
      ...db,
      serial: accountId,
      users: db.users.map((candidate) =>
        candidate.id === user.id
          ? { ...candidate, accounts: [...candidate.accounts, bankAccount] }
          : candidate,
      ),
    },
    account: bankAccount,
  }
}

export function depositToAccount(
  db: DbState,
  userId: number,
  accountId: number,
  amount: number,
): DbState {
  const user = findUser(db, userId)

  if (!user) {
    throw new Error('Inicia sesión para continuar')
  }

  const account = user.accounts.find(
    (candidate) => candidate.id === Number(accountId),
  )

  if (!account || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Ingresa un monto válido')
  }

  return {
    ...db,
    users: db.users.map((candidate) =>
      candidate.id === user.id
        ? {
            ...candidate,
            accounts: candidate.accounts.map((bankAccount) =>
              bankAccount.id === account.id
                ? { ...bankAccount, balance: bankAccount.balance + amount }
                : bankAccount,
            ),
          }
        : candidate,
    ),
  }
}

export function quoteFor(
  db: DbState,
  propertyId: number,
  start: string,
  end: string,
  guests = 1,
): Quote {
  const property = findProperty(db, propertyId)

  if (!property?.active) {
    throw new Error('Este inmueble no está disponible')
  }

  if (!start || !end || start < today() || end <= start) {
    throw new Error('Selecciona y confirma tus fechas')
  }

  if (start < property.from || end > property.until) {
    throw new Error('Estas fechas no están disponibles')
  }

  const overlapping = db.bookings.some(
    (booking) =>
      booking.property === property.id &&
      start < booking.end &&
      end > booking.start,
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
    total: nights * property.price,
    price: property.price,
  }
}

export function publishProperty(
  db: DbState,
  userId: number,
  data: PropertyInput,
  propertyId?: number,
): { db: DbState; property: Property } {
  const user = findUser(db, userId)

  if (!user) {
    throw new Error('Inicia sesión para continuar')
  }

  const existing = propertyId ? findProperty(db, propertyId) : undefined

  if (
    user.role !== 'propietario' ||
    (existing && existing.owner !== user.id)
  ) {
    throw new Error('No tienes permiso para modificar este inmueble')
  }

  if (propertyId && !existing) {
    throw new Error('Inmueble no encontrado')
  }

  const price = Number(data.price)
  const capacity = Number(data.capacity)

  if (
    !data.title?.trim() ||
    !data.address?.trim() ||
    !data.description?.trim() ||
    !PROPERTY_TYPES.includes(data.type) ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    !data.photos?.length ||
    !data.from ||
    !data.until ||
    data.until <= data.from
  ) {
    throw new Error('Corrige los campos marcados')
  }

  const duplicatedAddress = db.properties.some(
    (property) =>
      property.id !== existing?.id &&
      property.active &&
      property.address.trim().toLowerCase() ===
        data.address.trim().toLowerCase(),
  )

  if (duplicatedAddress) {
    throw new Error('Este inmueble ya está registrado')
  }

  if (
    existing &&
    isPropertyActive(db, existing) &&
    (existing.address !== data.address || existing.type !== data.type)
  ) {
    throw new Error(
      'No se puede modificar con reservas vigentes o futuras',
    )
  }

  const invalidAvailability =
    existing &&
    db.bookings.some(
      (booking) =>
        booking.property === existing.id &&
        (booking.start < data.from || booking.end > data.until) &&
        booking.end > today(),
    )

  if (invalidAvailability) {
    throw new Error(
      'La disponibilidad debe conservar las reservas existentes',
    )
  }

  const payload = {
    ...data,
    title: data.title.trim(),
    address: data.address.trim(),
    location: data.location.trim(),
    description: data.description.trim(),
    price,
    capacity,
  }

  if (existing) {
    const property = { ...existing, ...payload }
    return {
      db: {
        ...db,
        properties: db.properties.map((candidate) =>
          candidate.id === existing.id ? property : candidate,
        ),
      },
      property,
    }
  }

  const property: Property = {
    ...payload,
    id: db.serial + 1,
    owner: user.id,
    active: true,
  }

  return {
    db: {
      ...db,
      serial: property.id,
      properties: [...db.properties, property],
    },
    property,
  }
}

export function removeProperty(
  db: DbState,
  userId: number,
  propertyId: number,
): DbState {
  const user = findUser(db, userId)
  const property = findProperty(db, propertyId)

  if (!user) {
    throw new Error('Inicia sesión para continuar')
  }

  if (!property) {
    throw new Error('Inmueble no encontrado')
  }

  if (user.role !== 'propietario' || property.owner !== user.id) {
    throw new Error('No tienes permiso para modificar este inmueble')
  }

  if (isPropertyActive(db, property)) {
    throw new Error(
      'No puedes quitar este inmueble porque tiene reservas vigentes o futuras',
    )
  }

  return {
    ...db,
    properties: db.properties.map((candidate) =>
      candidate.id === property.id
        ? { ...candidate, active: false }
        : candidate,
    ),
  }
}

export function payForBooking(
  db: DbState,
  userId: number,
  quote: Quote,
  accountId: number,
): { db: DbState; booking: Booking } {
  const user = findUser(db, userId)

  if (!user) {
    throw new Error('Inicia sesión para continuar')
  }

  if (user.role !== 'cliente') {
    throw new Error('Las reservas requieren una cuenta de cliente')
  }

  const freshQuote = quoteFor(
    db,
    quote.property,
    quote.start,
    quote.end,
    quote.guests,
  )
  const property = findProperty(db, freshQuote.property)

  if (!property) {
    throw new Error('Este inmueble no está disponible')
  }

  const account = user.accounts.find(
    (candidate) => candidate.id === Number(accountId),
  )

  if (!account) {
    throw new Error('Selecciona una cuenta bancaria')
  }

  if (account.balance < freshQuote.total) {
    throw new Error('Saldo insuficiente')
  }

  const recipient = findUser(db, property.owner)
  const recipientAccount = recipient?.accounts[0]
  const bookingId = db.serial + 1

  const users = db.users.map((candidate) => {
    if (candidate.id === user.id) {
      return {
        ...candidate,
        accounts: candidate.accounts.map((bankAccount) =>
          bankAccount.id === account.id
            ? { ...bankAccount, balance: bankAccount.balance - freshQuote.total }
            : bankAccount,
        ),
      }
    }

    if (candidate.id === recipient?.id && recipientAccount) {
      return {
        ...candidate,
        accounts: candidate.accounts.map((bankAccount) =>
          bankAccount.id === recipientAccount.id
            ? {
                ...bankAccount,
                balance: bankAccount.balance + freshQuote.total,
              }
            : bankAccount,
        ),
      }
    }

    return candidate
  })

  const booking: Booking = {
    ...freshQuote,
    id: bookingId,
    user: user.id,
    title: property.title,
    photo: property.photos[0],
  }

  return {
    db: {
      ...db,
      serial: bookingId,
      users,
      bookings: [...db.bookings, booking],
    },
    booking,
  }
}

export function toggleFavoriteProperty(
  db: DbState,
  userId: number,
  propertyId: number,
): DbState {
  const user = findUser(db, userId)

  if (!user) {
    throw new Error('Inicia sesión para continuar')
  }

  const favorite = user.favorites.includes(propertyId)

  return {
    ...db,
    users: db.users.map((candidate) =>
      candidate.id === user.id
        ? {
            ...candidate,
            favorites: favorite
              ? candidate.favorites.filter((id) => id !== propertyId)
              : [...candidate.favorites, propertyId],
          }
        : candidate,
    ),
  }
}

export function filterCatalog(
  db: DbState,
  filters: Filters,
  userId?: number,
): Property[] {
  const user = findUser(db, userId ?? -1)
  const query = filters.q.toLowerCase()
  const maxPrice = Number(filters.max)
  const guests = Number(filters.guests)

  const properties = db.properties.filter((property) => {
    if (!property.active) return false

    if (filters.favorites && !user?.favorites.includes(property.id)) {
      return false
    }

    if (filters.type && property.type !== filters.type) {
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

    const searchable =
      `${property.title} ${property.location} ${property.description}`.toLowerCase()

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
  return role === 'propietario' ? 'Propietario' : 'Cliente'
}
