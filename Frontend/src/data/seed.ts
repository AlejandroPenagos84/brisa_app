import { today } from '../domain/brisa'
import type {
  BankAccount,
  DbState,
  PropertyType,
  User,
} from '../types'

const PHOTO_IDS = [
  'photo-1613490493576-7fde63acd811',
  'photo-1600210492486-724fe5c67fb0',
  'photo-1449158743715-0a90ebb6d2d8',
  'photo-1600607687939-ce8a6c25118c',
  'photo-1613977257363-707ba9348227',
  'photo-1600566753086-00f18fb6b3ea',
]

const PHOTOS = PHOTO_IDS.map(
  (id) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`,
)

const NAMES = [
  'Casa Oliva',
  'Loft de la luz',
  'Cabaña del bosque',
  'Casa de la brisa',
  'Patio de verano',
  'Balcón de la montaña',
]

const CITIES = [
  'Villa de Leyva, Boyacá',
  'Chapinero, Bogotá',
  'Guatavita, Cundinamarca',
  'Cartagena, Bolívar',
  'Anapoima, Cundinamarca',
  'El Poblado, Medellín',
]

const TYPES: PropertyType[] = [
  'Casa',
  'Loft',
  'Cabaña',
  'Casa',
  'Casa',
  'Apartamento',
]

const CAPACITIES = [4, 2, 4, 6, 8, 3]

const PRICES = [320000, 210000, 280000, 540000, 620000, 260000]

const DESCRIPTION =
  'Un espacio luminoso para descansar y compartir. Disfruta de una estancia tranquila, cocina equipada, wifi y rincones pensados para sentirte en casa.'

export const DEMO_CREDENTIALS = {
  client: 'juan@brisa.co',
  owner: 'ana@brisa.co',
  password: 'Brisa123',
}

function createAccount(
  id: number,
  bank: string,
  number: string,
): BankAccount {
  return { id, bank, type: 'Ahorros', number, balance: 0 }
}

export function createSeedDb(): DbState {
  const owner: User = {
    id: 11,
    role: 'propietario',
    name: 'Ana',
    surname: 'Vargas',
    document: '10001',
    phone: '3001234567',
    email: DEMO_CREDENTIALS.owner,
    password: DEMO_CREDENTIALS.password,
    accounts: [createAccount(12, 'Bancolombia', '1234567890')],
    favorites: [],
  }

  const client: User = {
    id: 13,
    role: 'cliente',
    name: 'Juan',
    surname: 'Pérez',
    document: '10002',
    phone: '3001234568',
    email: DEMO_CREDENTIALS.client,
    password: DEMO_CREDENTIALS.password,
    accounts: [createAccount(14, 'Davivienda', '9876543210')],
    favorites: [],
  }

  return {
    serial: 20,
    users: [owner, client],
    properties: NAMES.map((title, index) => ({
      id: 15 + index,
      owner: owner.id,
      active: true,
      title,
      address: `${CITIES[index]}, Calle ${index + 1}`,
      location: CITIES[index],
      type: TYPES[index],
      description: DESCRIPTION,
      capacity: CAPACITIES[index],
      price: PRICES[index],
      photos: [PHOTOS[index]],
      from: today(),
      until: '2030-12-31',
    })),
    bookings: [],
  }
}
