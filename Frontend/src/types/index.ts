export type Role = 'cliente' | 'propietario'

export type AccountType = 'Ahorros' | 'Corriente'

export type PropertyType = 'Casa' | 'Loft' | 'Cabaña' | 'Apartamento'

export type SortOption = 'recommended' | 'price'

export interface BankAccount {
  id: number
  bank: string
  type: AccountType
  number: string
  balance: number
}

export interface User {
  id: number
  role: Role
  name: string
  surname: string
  document: string
  email: string
  phone: string
  password: string
  accounts: BankAccount[]
  favorites: number[]
}

export interface Property {
  id: number
  owner: number
  active: boolean
  title: string
  address: string
  location: string
  type: PropertyType
  description: string
  capacity: number
  price: number
  photos: string[]
  from: string
  until: string
}

export interface Quote {
  property: number
  start: string
  end: string
  guests: number
  nights: number
  total: number
  price: number
}

export interface Booking extends Quote {
  id: number
  user: number
  title: string
  photo: string
}

export interface RegistrationDraft {
  role: Role
  name: string
  surname: string
  document: string
  email: string
  phone: string
  password: string
}

export interface AccountInput {
  bank: string
  type: AccountType
  number: string
}

export interface PropertyInput {
  title: string
  address: string
  location: string
  type: PropertyType
  description: string
  capacity: number
  price: number
  photos: string[]
  from: string
  until: string
}

export interface PropertyFormValues {
  title: string
  address: string
  location: string
  type: PropertyType
  description: string
  capacity: string
  price: string
  from: string
  until: string
}

export interface DbState {
  serial: number
  users: User[]
  properties: Property[]
  bookings: Booking[]
}

export interface SearchForm {
  q: string
  start: string
  end: string
  guests: number
}

export interface Filters extends SearchForm {
  type: PropertyType | ''
  max: string
  favorites: boolean
  sort: SortOption
}

export type LoginTarget =
  | 'favorites'
  | 'payment'
  | 'owner'
  | 'bookings'
  | 'wallet'
  | null

export type ModalState =
  | { type: 'login'; next?: LoginTarget }
  | { type: 'register'; draft: RegistrationDraft }
  | { type: 'register-bank'; draft: RegistrationDraft }
  | { type: 'register-success' }
  | { type: 'deposit' }
  | { type: 'add-account' }
  | { type: 'confirm-payment'; accountId: number; total: number }
  | { type: 'insufficient-funds' }
  | { type: 'discard-changes' }
  | { type: 'remove-property'; propertyId: number }
  | { type: 'cannot-remove' }
