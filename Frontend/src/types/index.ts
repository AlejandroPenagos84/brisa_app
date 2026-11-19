export type Role = 'cliente' | 'propietario' | 'administrador'



export type PropertyStatus = 'ACTIVE' | 'INACTIVE'

export type RentalStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED'

export type TransactionType = 'PAYMENT' | 'REFUND'

export type SortOption = 'recommended' | 'price'

export interface BankAccount {
  id: string
  bank: string
  bankId: string
  type: string
  number: string
  balance: number
  balanceKnown: boolean
}

export interface User {
  id: string
  role: Role
  name: string
  surname: string
  email: string
  phone: string
  cityId?: string
  accounts: BankAccount[]
  favorites: string[]
}

export interface Property {
  id: string
  owner: string
  status: PropertyStatus
  manuallyInactive: boolean
  title: string
  address: string
  cityId: string
  location: string
  description: string
  area: number
  numberOfRooms: number
  capacity: number
  price: number
  // Uploaded by the owner, ordered; the first one is the cover
  images: PropertyImage[]
  // What the pages show: the images, or a city photo when there are none
  photos: string[]
}

export interface PropertyImage {
  id: string
  // Absolute URL, ready for <img src>
  url: string
}

export interface Quote {
  property: string
  start: string
  end: string
  guests: number
  nights: number
  total: number
  price: number
}

export interface PaymentReceipt {
  transactionId: string
  status: 'APPROVED'
  amount: number
  paidFromAccount: string
  paidAt: string
}

export interface Booking extends Omit<Quote, 'guests' | 'price'> {
  id: string
  user: string
  title: string
  photo: string
  status: RentalStatus
  payment?: PaymentReceipt
}

export interface RegistrationDraft {
  role: Extract<Role, 'cliente' | 'propietario'>
  name: string
  surname: string
  email: string
  phone: string
  password: string
  cityId: string
}

export interface AccountInput {
  bankId: string
  type: string
  number: string
}

export interface PropertyInput {
  cityId: string
  address: string
  area: number
  numberOfRooms: number
  capacity: number
  price: number
}

export interface PropertyFormValues {
  cityId: string
  address: string
  area: string
  numberOfRooms: string
  capacity: string
  price: string
}

export interface ApiBank {
  id: string
  name: string
  countryId: string
}

export interface ApiCity {
  id: string
  name: string
  countryId: string
}

export interface ApiCountry {
  id: string
  name: string
}

export interface Administrator {
  id: string
  name: string
  phone: string
  email: string
  bankId: string
  accountNumber: string
  accountType: string
  balance: number
}

export interface Transaction {
  id: string
  administratorId: string
  ownerId: string
  type: TransactionType
  grossAmount: number
  commission: number
  netAmount: number
  createdAt: string
}

export interface DbState {
  users: User[]
  properties: Property[]
  bookings: Booking[]
  banks: ApiBank[]
  cities: ApiCity[]
  countries: ApiCountry[]
  administrator: Administrator | null
  transactions: Transaction[]
}

export interface SearchForm {
  q: string
  start: string
  end: string
  guests: number
}

export interface Filters extends SearchForm {
  cityId: string
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
  | 'admin'
  | null

export type ModalState =
  | { type: 'login'; next?: LoginTarget }
  | { type: 'register'; draft: RegistrationDraft }
  | { type: 'register-bank'; draft: RegistrationDraft }
  | { type: 'register-success' }
  | { type: 'confirm-payment'; total: number }
  | { type: 'cancel-booking'; booking: Booking }
  | { type: 'discard-changes' }
  | { type: 'remove-property'; propertyId: string }
  | { type: 'cannot-remove' }
