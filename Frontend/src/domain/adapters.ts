import type {
  Administrator,
  ApiBank,
  BankAccount,
  Booking,
  Property,
  Transaction,
  User,
} from '../types'
import type {
  ApiAdministrator,
  ApiClient,
  ApiOwner,
  ApiProperty,
  ApiRental,
  ApiReservation,
  ApiTransaction,
} from '../services/api'

const CITY_PHOTOS: Record<string, string> = {
  Bogotá:
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
  Medellín:
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85',
  'Ciudad de México':
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  Madrid:
    'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85',
  Colombia:
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85',
}

const DEFAULT_PHOTO = CITY_PHOTOS.Colombia

function photoFor(cityName: string): string {
  return CITY_PHOTOS[cityName] ?? DEFAULT_PHOTO
}

export function adaptProperty(property: ApiProperty): Property {
  const cityName = property.city?.name ?? 'Ubicación sin confirmar'

  return {
    id: property.id,
    owner: property.ownerId,
    status: property.status,
    manuallyInactive: property.manuallyInactive,
    title: property.address,
    address: property.address,
    cityId: property.cityId,
    location: cityName,
    description: `${property.area} m² con ${property.numberOfRooms} ${
      property.numberOfRooms === 1 ? 'habitación' : 'habitaciones'
    }, para hasta ${property.capacity} ${
      property.capacity === 1 ? 'huésped' : 'huéspedes'
    }.`,
    area: property.area,
    numberOfRooms: property.numberOfRooms,
    capacity: property.capacity,
    price: property.price,
    photos: [photoFor(cityName)],
  }
}

function bankName(bankId: string, banks: ApiBank[], fallback?: string) {
  return banks.find((bank) => bank.id === bankId)?.name ?? fallback ?? 'Banco'
}

function accountFor(
  account: {
    bankId: string
    accountNumber: string
    accountType: string
    bank?: { name: string }
  },
  banks: ApiBank[],
  balance: number,
  balanceKnown: boolean,
): BankAccount {
  return {
    id: `${account.bankId}:${account.accountNumber}`,
    bank: bankName(account.bankId, banks, account.bank?.name),
    bankId: account.bankId,
    type: account.accountType,
    number: account.accountNumber,
    balance,
    balanceKnown,
  }
}

function favoritesFor(id: string, favorites: Record<string, string[]>): string[] {
  return favorites[id] ?? []
}

export function adaptClient(
  client: ApiClient,
  banks: ApiBank[],
  favorites: Record<string, string[]> = {},
): User {
  return {
    id: client.id,
    role: 'cliente',
    name: client.name,
    surname: '',
    email: client.email,
    phone: client.phone,
    cityId: client.cityId,
    accounts: [
      accountFor(client, banks, 0, false),
    ],
    favorites: favoritesFor(client.id, favorites),
  }
}

export function adaptOwner(
  owner: ApiOwner,
  banks: ApiBank[],
  favorites: Record<string, string[]> = {},
): User {
  return {
    id: owner.id,
    role: 'propietario',
    name: owner.name,
    surname: '',
    email: owner.email,
    phone: owner.phone,
    accounts: [
      accountFor(owner, banks, owner.balance, true),
    ],
    favorites: favoritesFor(owner.id, favorites),
  }
}

export function adaptAdministratorUser(
  administrator: ApiAdministrator,
  banks: ApiBank[],
  favorites: Record<string, string[]> = {},
): User {
  return {
    id: administrator.id,
    role: 'administrador',
    name: administrator.name,
    surname: '',
    email: administrator.email,
    phone: administrator.phone,
    accounts: [
      accountFor(administrator, banks, administrator.balance, true),
    ],
    favorites: favoritesFor(administrator.id, favorites),
  }
}

export function adaptAdministrator(
  administrator: ApiAdministrator,
): Administrator {
  return {
    id: administrator.id,
    name: administrator.name,
    phone: administrator.phone,
    email: administrator.email,
    bankId: administrator.bankId,
    accountNumber: administrator.accountNumber,
    accountType: administrator.accountType,
    balance: administrator.balance,
  }
}

export function adaptTransaction(transaction: ApiTransaction): Transaction {
  return {
    id: transaction.id,
    administratorId: transaction.administratorId,
    ownerId: transaction.ownerId,
    type: transaction.type,
    grossAmount: transaction.grossAmount,
    commission: transaction.commission,
    netAmount: transaction.netAmount,
    createdAt: transaction.createdAt,
  }
}

function bookingFromRental(
  rental: ApiRental | ApiReservation,
  property: Property,
): Booking {
  const start = rental.startDate.slice(0, 10)
  const end = rental.endDate.slice(0, 10)
  const nights = Math.round(
    (Date.parse(end) - Date.parse(start)) / 86_400_000,
  )

  return {
    id: `${rental.propertyId}:${rental.clientId}:${start}`,
    property: rental.propertyId,
    user: rental.clientId,
    title: property.title,
    photo: property.photos[0],
    start,
    end,
    nights,
    total: rental.chargedAmount,
    status: rental.status,
  }
}

export function adaptRental(
  rental: ApiRental,
  properties: Property[] = [],
): Booking {
  const property =
    properties.find((candidate) => candidate.id === rental.propertyId) ??
    adaptProperty(rental.property)

  return bookingFromRental(rental, property)
}

export function adaptReservation(
  reservation: ApiReservation,
  property: Property,
): Booking {
  return {
    ...bookingFromRental(reservation, property),
    total: reservation.payment.amount,
    payment: {
      transactionId: reservation.payment.transactionId,
      status: reservation.payment.status,
      amount: reservation.payment.amount,
      paidFromAccount: reservation.payment.paidFromAccount,
      paidAt: reservation.payment.paidAt,
    },
  }
}
