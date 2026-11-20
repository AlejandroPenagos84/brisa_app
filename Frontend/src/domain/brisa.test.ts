import { describe, expect, it } from 'vitest'
import type { DbState } from '../types'
import type { ApiRental, ApiReservation } from '../services/api'
import { adaptProperty, adaptRental, adaptReservation } from './adapters'
import { createDefaultFilters, filterCatalog, formatPhone, isPropertyActive, isValidPhone, phoneDigits, quoteFor, refundFor, today } from './brisa'

describe('phone', () => {
  it('keeps at most 10 digits and groups them as 3-3-4', () => {
    expect(phoneDigits('33a3-333 33339999')).toBe('3333333333')
    expect(formatPhone('3333333333')).toBe('333 333 3333')
    expect(formatPhone('33333')).toBe('333 33')
  })

  it('requires exactly 10 digits', () => {
    expect(isValidPhone('3333333333')).toBe(true)
    expect(isValidPhone('333 333 3333')).toBe(true)
    expect(isValidPhone('333333333')).toBe(false)
    expect(isValidPhone('333-333-3333')).toBe(false)
  })
})

describe('refundFor', () => {
  it('returns the total minus the 10% commission', () => {
    expect(refundFor(300)).toBe(270)
    expect(refundFor(640_000.5)).toBe(576_000.45)
  })
})

function addDays(date: string, days: number): string {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

const apiProperty = {
  id: 'propiedad-1',
  ownerId: 'propietario-1',
  cityId: 'bogota',
  city: { id: 'bogota', name: 'Bogotá' },
  address: 'Calle 123',
  area: 80.25,
  numberOfRooms: 2,
  capacity: 4,
  price: 320_000.25,
  status: 'ACTIVE' as const,
  manuallyInactive: false,
}
const property = adaptProperty(apiProperty)
const db: DbState = {
  properties: [property],
  bookings: [],
  users: [],
  cities: [],
  countries: [],
  banks: [],
  administrator: null,
  transactions: [],
}

function rental(startDate: string, endDate: string): ApiRental {
  return {
    propertyId: property.id,
    clientId: 'cliente-1',
    startDate: `${startDate}T00:00:00.000Z`,
    endDate: `${endDate}T00:00:00.000Z`,
    status: 'UPCOMING',
    chargedAmount: 500_000.50,
    property: apiProperty,
    client: {
      id: 'cliente-1',
      name: 'Sofía',
      email: 'sofia@example.com',
      phone: '3001234567',
      cityId: 'bogota',
      bankId: 'banco-1',
      accountNumber: '2001',
      accountType: 'Ahorros',
    },
  }
}

describe('catálogo y reservas', () => {
  it('calcula la cotización por noches y conserva los centavos', () => {
    expect(quoteFor(db, property.id, addDays(today(), 1), addDays(today(), 3), 2))
      .toMatchObject({ nights: 2, total: 640_000.50, price: apiProperty.price })
  })

  it('rechaza fechas y huéspedes inválidos', () => {
    const start = addDays(today(), 1)
    const end = addDays(today(), 2)

    expect(() => quoteFor(db, property.id, end, start, 1))
      .toThrow('Selecciona y confirma tus fechas')
    expect(() => quoteFor(db, property.id, start, end, 8))
      .toThrow('Revisa la cantidad de huéspedes')
  })

  it('filtra por ciudad, precio y texto', () => {
    const filters = createDefaultFilters()

    expect(filterCatalog(db, { ...filters, cityId: 'bogota', q: 'calle' })).toEqual([property])
    expect(filterCatalog(db, { ...filters, cityId: 'medellin' })).toEqual([])
    expect(filterCatalog(db, { ...filters, max: '320000' })).toEqual([])
  })

  it('oculta los inmuebles pausados y conserva los que tienen reservas', () => {
    const occupied = adaptProperty({ ...apiProperty, status: 'INACTIVE' })
    const paused = adaptProperty({
      ...apiProperty,
      id: 'propiedad-2',
      status: 'INACTIVE',
      manuallyInactive: true,
    })
    const state = { ...db, properties: [occupied, paused] }

    expect(filterCatalog(state, createDefaultFilters())).toEqual([occupied])
    expect(() => quoteFor(state, paused.id, addDays(today(), 1), addDays(today(), 2)))
      .toThrow('Este inmueble no está disponible')
  })

  it('rechaza solapamientos incluso cuando dos reservas comparten la fecha límite', () => {
    const start = addDays(today(), 2)
    const end = addDays(today(), 4)
    const state = { ...db, bookings: [adaptRental(rental(start, end))] }

    expect(isPropertyActive(state, property)).toBe(true)
    expect(() => quoteFor(state, property.id, end, addDays(end, 1)))
      .toThrow('Estas fechas no están disponibles')
    expect(quoteFor(state, property.id, addDays(end, 1), addDays(end, 2)).nights).toBe(1)
  })

  it('muestra el importe guardado aunque haya cambiado la tarifa', () => {
    const booking = adaptRental(rental('2026-11-19', '2026-11-21'), [property])
    expect(booking).toMatchObject({ start: '2026-11-19', nights: 2, total: 500_000.50 })
  })

  it('interpreta el comprobante de reserva sin esperar los objetos de detalle', () => {
    const { property: _property, client: _client, ...record } = rental('2026-11-19', '2026-11-21')
    const payment: ApiReservation['payment'] = {
      transactionId: 'pago-1',
      status: 'APPROVED',
      paidFromAccount: '****2001',
      paidAt: '2026-11-17T23:00:00.000Z',
      amount: record.chargedAmount,
    }
    expect(adaptReservation({ ...record, payment }, property))
      .toMatchObject({ total: payment.amount, payment })
  })
})
