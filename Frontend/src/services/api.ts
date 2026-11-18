import { request } from './http'

export interface ApiOwner {
  id: string
  name: string
  phone: string
  email: string
  bankId: string
  accountNumber: string
  accountType: string
  balance: number
  bank?: {
    id: string
    name: string
  }
}

export interface ApiClient {
  id: string
  name: string
  phone: string
  email: string
  cityId: string
  bankId: string
  accountNumber: string
  accountType: string
  bank?: {
    id: string
    name: string
    countryId: string
  }
}

export interface ApiProperty {
  id: string
  ownerId: string
  cityId: string
  address: string
  area: number
  numberOfRooms: number
  capacity: number
  price: number
  status: 'ACTIVE' | 'INACTIVE'
  manuallyInactive: boolean
  city?: {
    id: string
    name: string
  }
}

interface ApiRentalRecord {
  propertyId: string
  clientId: string
  startDate: string
  endDate: string
  chargedAmount: number
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED'
}

export interface ApiRental extends ApiRentalRecord {
  property: ApiProperty
  client: ApiClient
}

export interface ApiReservation extends ApiRentalRecord {
  payment: {
    transactionId: string
    status: 'APPROVED'
    amount: number
    paidFromAccount: string
    paidAt: string
  }
}

export interface ApiAdministrator {
  id: string
  name: string
  phone: string
  email: string
  bankId: string
  accountNumber: string
  accountType: string
  balance: number
}

export interface ApiTransaction {
  id: string
  administratorId: string
  ownerId: string
  type: 'PAYMENT' | 'REFUND'
  grossAmount: number
  commission: number
  netAmount: number
  createdAt: string
}

export interface ProfilePayload {
  name: string
  phone: string
  email: string
  bankId: string
  accountNumber: string
  accountType: string
}

interface CreateClientPayload extends ProfilePayload {
  cityId: string
}

export interface CreatePropertyPayload {
  ownerId: string
  cityId: string
  address: string
  area: number
  numberOfRooms: number
  capacity: number
  price: number
}

export interface UpdatePropertyPayload {
  ownerId: string
  address?: string
  area?: number
  numberOfRooms?: number
  capacity?: number
  price?: number
  status?: ApiProperty['status']
}

export interface CreateRentalPayload {
  propertyId: string
  clientId: string
  startDate: string
  endDate: string
}

export const api = {
  getCountries: () =>
    request<Array<{ id: string; name: string }>>('/countries'),
  getCities: () =>
    request<
      Array<{
        id: string
        name: string
        countryId: string
        country: { id: string; name: string }
      }>
    >('/cities'),
  getBanks: () =>
    request<
      Array<{
        id: string
        name: string
        countryId: string
        country: { id: string; name: string }
      }>
    >('/banks'),
  getClients: () => request<ApiClient[]>('/clients'),
  getOwners: () => request<ApiOwner[]>('/owners'),
  getOwnerEarnings: (id: string) =>
    request<{ totalEarnings: number }>(`/owners/${id}/earnings`),
  getOwnerTransactions: (id: string) =>
    request<{ transactions: ApiTransaction[] }>(`/owners/${id}/transactions`),
  getAdministrator: () => request<ApiAdministrator>('/administrator'),
  getAdministratorTransactions: () =>
    request<ApiTransaction[]>('/administrator/transactions'),
  getProperties: () => request<ApiProperty[]>('/properties'),
  getRentals: () => request<ApiRental[]>('/rentals'),
  createClient: (payload: CreateClientPayload) =>
    request<ApiClient>('/clients', { method: 'POST', body: payload }),
  createOwner: (payload: ProfilePayload) =>
    request<ApiOwner>('/owners', { method: 'POST', body: payload }),
  updateClient: (id: string, payload: Partial<CreateClientPayload>) =>
    request<ApiClient>(`/clients/${id}`, { method: 'PATCH', body: payload }),
  updateOwner: (id: string, payload: Partial<ProfilePayload>) =>
    request<ApiOwner>(`/owners/${id}`, { method: 'PATCH', body: payload }),
  updateAdministrator: (payload: Partial<ProfilePayload>) =>
    request<ApiAdministrator>('/administrator', { method: 'PATCH', body: payload }),
  createProperty: (payload: CreatePropertyPayload) =>
    request<ApiProperty>('/properties', { method: 'POST', body: payload }),
  updateProperty: (id: string, payload: UpdatePropertyPayload) =>
    request<ApiProperty>(`/properties/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  deleteProperty: (id: string, ownerId: string) =>
    request<void>(`/properties/${id}?ownerId=${ownerId}`, {
      method: 'DELETE',
    }),
  createRental: (payload: CreateRentalPayload) =>
    request<ApiReservation>('/rentals', { method: 'POST', body: payload }),
  cancelRental: (propertyId: string, clientId: string, startDate: string) =>
    request<void>(`/rentals/${propertyId}/${clientId}/${startDate}`, {
      method: 'DELETE',
    }),
}
