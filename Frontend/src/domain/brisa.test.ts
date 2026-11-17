import { describe, expect, it } from 'vitest'
import { createSeedDb } from '../data/seed'
import {
  createUser,
  depositToAccount,
  filterCatalog,
  isPropertyActive,
  payForBooking,
  publishProperty,
  quoteFor,
  removeProperty,
  today,
  createDefaultFilters,
} from './brisa'

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

describe('brisa domain', () => {
  it('crea los datos de demostración originales', () => {
    const db = createSeedDb()

    expect(db.users).toHaveLength(2)
    expect(db.properties).toHaveLength(6)
    expect(db.properties[0].title).toBe('Casa Oliva')
    expect(db.properties[0].price).toBe(320000)
    expect(db.bookings).toHaveLength(0)
  })

  it('calcula la cotización por noches', () => {
    const db = createSeedDb()
    const start = addDays(today(), 1)
    const end = addDays(today(), 3)
    const quote = quoteFor(db, 15, start, end, 2)

    expect(quote.nights).toBe(2)
    expect(quote.total).toBe(640000)
    expect(quote.price).toBe(320000)
  })

  it('rechaza fechas y huéspedes inválidos', () => {
    const db = createSeedDb()
    const start = addDays(today(), 3)
    const end = addDays(today(), 1)

    expect(() => quoteFor(db, 15, start, end, 1)).toThrow(
      'Selecciona y confirma tus fechas',
    )
    expect(() =>
      quoteFor(db, 15, addDays(today(), 1), addDays(today(), 2), 8),
    ).toThrow('Revisa la cantidad de huéspedes')
  })

  it('filtra por tipo, precio y texto', () => {
    const db = createSeedDb()
    const filters = createDefaultFilters()

    expect(
      filterCatalog(db, { ...filters, type: 'Loft' }).map(
        (property) => property.title,
      ),
    ).toEqual(['Loft de la luz'])

    expect(
      filterCatalog(db, { ...filters, max: '300000' }),
    ).toHaveLength(3)

    expect(
      filterCatalog(db, { ...filters, q: 'cartagena' })[0].title,
    ).toBe('Casa de la brisa')
  })

  it('registra usuarios y valida duplicados', () => {
    const db = createSeedDb()
    const data = {
      role: 'cliente' as const,
      name: 'Laura',
      surname: 'Gómez',
      document: '10003',
      phone: '3001234569',
      email: 'laura@brisa.co',
      password: 'Brisa123',
    }
    const account = {
      bank: 'Bancolombia',
      type: 'Ahorros' as const,
      number: '1122334455',
    }
    const result = createUser(db, data, account)

    expect(result.user.id).toBe(21)
    expect(result.user.accounts[0].id).toBe(22)
    expect(result.db.users).toHaveLength(3)
    expect(() => createUser(result.db, data, account)).toThrow(
      'Ya existe una cuenta con estos datos',
    )
  })

  it('publica inmuebles y rechaza direcciones duplicadas', () => {
    const db = createSeedDb()
    const input = {
      title: 'Casa del río',
      address: 'Calle Nueva 1',
      location: 'Bogotá',
      type: 'Casa' as const,
      description: 'Una casa para descansar junto al río.',
      capacity: 2,
      price: 300000,
      photos: ['https://example.com/foto.jpg'],
      from: today(),
      until: addDays(today(), 30),
    }

    const created = publishProperty(db, 11, input)

    expect(created.db.properties).toHaveLength(7)
    expect(created.property.id).toBe(21)
    expect(created.property.owner).toBe(11)
    expect(() =>
      publishProperty(created.db, 11, { ...input, title: 'Otra casa' }),
    ).toThrow('Este inmueble ya está registrado')

    const edited = publishProperty(
      created.db,
      11,
      { ...input, title: 'Casa del río renovada' },
      created.property.id,
    )

    expect(edited.property.title).toBe('Casa del río renovada')
  })

  it('impide quitar inmuebles con reservas y desactiva los disponibles', () => {
    const db = createSeedDb()
    const start = addDays(today(), 5)
    const end = addDays(today(), 7)
    const funded = depositToAccount(db, 13, 14, 1000000)
    const quote = quoteFor(funded, 15, start, end, 2)
    const booked = payForBooking(funded, 13, quote, 14).db

    expect(() => removeProperty(booked, 11, 15)).toThrow(
      'No puedes quitar este inmueble porque tiene reservas vigentes o futuras',
    )

    const updated = removeProperty(booked, 11, 16)

    expect(
      updated.properties.find((property) => property.id === 16)?.active,
    ).toBe(false)
  })

  it('paga una reserva, actualiza saldos y bloquea solapamientos', () => {
    const db = createSeedDb()
    const start = addDays(today(), 5)
    const end = addDays(today(), 7)
    const funded = depositToAccount(db, 13, 14, 1000000)
    const quote = quoteFor(funded, 15, start, end, 2)
    const result = payForBooking(funded, 13, quote, 14)

    expect(result.booking.total).toBe(640000)
    expect(result.db.bookings).toHaveLength(1)
    expect(
      result.db.users.find((user) => user.id === 13)?.accounts[0].balance,
    ).toBe(360000)
    expect(
      result.db.users.find((user) => user.id === 11)?.accounts[0].balance,
    ).toBe(640000)

    const bookedProperty = result.db.properties.find(
      (property) => property.id === 15,
    )

    expect(bookedProperty && isPropertyActive(result.db, bookedProperty)).toBe(
      true,
    )
    expect(() =>
      quoteFor(result.db, 15, addDays(today(), 6), addDays(today(), 8), 1),
    ).toThrow('Estas fechas no están disponibles')
  })
})
