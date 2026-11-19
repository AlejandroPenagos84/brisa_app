import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CREDENTIALS } from '../data/seed'
import {
  adaptAdministrator,
  adaptAdministratorUser,
  adaptClient,
  adaptOwner,
  adaptProperty,
  adaptRental,
  adaptReservation,
  adaptTransaction,
} from '../domain/adapters'
import {
  createDefaultFilters,
  findProperty,
  isValidAccountNumber,
} from '../domain/brisa'
import { api, type ProfilePayload } from '../services/api'
import type {
  AccountInput,
  Booking,
  DbState,
  Filters,
  LoginTarget,
  ModalState,
  Property,
  PropertyInput,
  PropertyStatus,
  Quote,
  RegistrationDraft,
  User,
} from '../types'

interface BrisaContextValue {
  db: DbState
  user: User | null
  filters: Filters
  modal: ModalState | null
  toast: string | null
  pendingQuote: Quote | null
  lastBooking: Booking | null
  loading: boolean
  ready: boolean
  error: string | null
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  register: (data: RegistrationDraft, account: AccountInput) => Promise<User>
  updateProfile: (data: ProfilePayload & { cityId?: string }) => Promise<void>
  publish: (data: PropertyInput, propertyId?: string) => Promise<Property>
  setPropertyStatus: (id: string, status: PropertyStatus) => Promise<void>
  remove: (propertyId: string) => Promise<void>
  // Removes and then uploads; returns the messages of the failed files
  syncPropertyImages: (
    propertyId: string,
    removeIds: string[],
    files: File[],
  ) => Promise<string[]>
  pay: (quote: Quote) => Promise<Booking>
  cancelBooking: (booking: Booking) => Promise<void>
  toggleFavorite: (propertyId: string) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  setPendingQuote: (quote: Quote | null) => void
  setLastBooking: (booking: Booking | null) => void
  openModal: (modal: ModalState) => void
  closeModal: () => void
  requireLogin: (next?: LoginTarget) => boolean
  showToast: (message: string) => void
}

const BrisaContext = createContext<BrisaContextValue | null>(null)

const EMPTY_DB: DbState = {
  users: [],
  properties: [],
  bookings: [],
  banks: [],
  cities: [],
  countries: [],
  administrator: null,
  transactions: [],
}

const FAVORITES_KEY = 'brisa.favorites'
const PASSWORDS_KEY = 'brisa.passwords'
const SESSION_KEY = 'brisa.session'

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function savePassword(email: string, password: string) {
  const passwords = readJson<Record<string, string>>(PASSWORDS_KEY, {})
  writeJson(PASSWORDS_KEY, {
    ...passwords,
    [email.trim().toLowerCase()]: password,
  })
}

export function BrisaProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbState>(EMPTY_DB)
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    () => localStorage.getItem(SESSION_KEY),
  )
  const [filters, setFiltersState] = useState<Filters>(createDefaultFilters)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingQuote, setPendingQuote] = useState<Quote | null>(null)
  const [lastBooking, setLastBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRefresh = useRef(0)

  const user = useMemo(
    () => db.users.find((candidate) => candidate.id === currentUserId) ?? null,
    [db.users, currentUserId],
  )

  const refresh = useCallback(async () => {
    const revision = ++latestRefresh.current
    setLoading(true)

    try {
      const [
        properties,
        clients,
        owners,
        administrator,
        transactions,
        rentals,
        banks,
        cities,
        countries,
      ] = await Promise.all([
        api.getProperties(),
        api.getClients(),
        api.getOwners(),
        api.getAdministrator(),
        api.getAdministratorTransactions(),
        api.getRentals(),
        api.getBanks(),
        api.getCities(),
        api.getCountries(),
      ])

      if (revision !== latestRefresh.current) return

      const favorites = readJson<Record<string, string[]>>(FAVORITES_KEY, {})
      const propertyViews = properties.map(adaptProperty)
      const users = [
        ...clients.map((client) => adaptClient(client, banks, favorites)),
        ...owners.map((owner) => adaptOwner(owner, banks, favorites)),
        adaptAdministratorUser(administrator, banks, favorites),
      ]

      setDb({
        users,
        properties: propertyViews,
        bookings: rentals.map((rental) =>
          adaptRental(rental, propertyViews),
        ),
        banks,
        cities,
        countries,
        administrator: adaptAdministrator(administrator),
        transactions: transactions.map(adaptTransaction),
      })
      setReady(true)
      setError(null)
    } catch (caught) {
      if (revision === latestRefresh.current) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'No se pudieron cargar los datos de Brisa',
        )
      }
    } finally {
      if (revision === latestRefresh.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      if (!ready) {
        throw new Error('Espera a que Brisa se conecte con el servidor')
      }
      const normalizedEmail = email.trim().toLowerCase()
      const candidate = db.users.find(
        (user) => user.email.toLowerCase() === normalizedEmail,
      )

      if (!candidate) {
        throw new Error('Credenciales incorrectas')
      }

      const passwords = readJson<Record<string, string>>(PASSWORDS_KEY, {})
      const expected = passwords[normalizedEmail] ?? DEMO_CREDENTIALS.password

      if (password !== expected) {
        throw new Error('Credenciales incorrectas')
      }

      setCurrentUserId(candidate.id)
      localStorage.setItem(SESSION_KEY, candidate.id)
      return candidate
    },
    [db.users, ready],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUserId(null)
    setPendingQuote(null)
    setLastBooking(null)
    setModal(null)
    setFiltersState((current) => ({ ...current, favorites: false }))
  }, [])

  const register = useCallback(
    async (data: RegistrationDraft, account: AccountInput) => {
      const name = `${data.name.trim()} ${data.surname.trim()}`.trim()
      const email = data.email.trim().toLowerCase()
      const password = data.password

      if (!name || !email || !data.phone.trim()) {
        throw new Error('Corrige los campos marcados')
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      if (!account.bankId || !account.number.trim()) {
        throw new Error('Revisa los datos de la cuenta bancaria')
      }

      if (!isValidAccountNumber(account.number.trim())) {
        throw new Error('El número de cuenta debe tener el formato XXXX-XXXX-XXXX-XXXX')
      }

      if (data.role === 'cliente' && !data.cityId) {
        throw new Error('Selecciona tu ciudad')
      }

      if (data.role === 'cliente') {
        const client = await api.createClient({
          name,
          phone: data.phone.trim(),
          email,
          cityId: data.cityId,
          bankId: account.bankId,
          accountNumber: account.number.trim(),
          accountType: account.type,
        })

        const registered = adaptClient(client, db.banks)
        savePassword(email, password)
        setDb((state) => ({ ...state, users: [...state.users, registered] }))
        setCurrentUserId(client.id)
        localStorage.setItem(SESSION_KEY, client.id)
        await refresh()
        return registered
      }

      const owner = await api.createOwner({
        name,
        phone: data.phone.trim(),
        email,
        bankId: account.bankId,
        accountNumber: account.number.trim(),
        accountType: account.type,
      })

      const registered = adaptOwner(owner, db.banks)
      savePassword(email, password)
      setDb((state) => ({ ...state, users: [...state.users, registered] }))
      setCurrentUserId(owner.id)
      localStorage.setItem(SESSION_KEY, owner.id)
      await refresh()
      return registered
    },
    [db.banks, refresh],
  )

  const updateProfile = useCallback(
    async ({ cityId, ...data }: ProfilePayload & { cityId?: string }) => {
      if (!user) throw new Error('Inicia sesión para actualizar tu cuenta')

      const oldEmail = user.email.toLowerCase()
      const email = data.email.trim().toLowerCase()
      if (db.users.some((candidate) =>
        candidate.id !== user.id && candidate.email.toLowerCase() === email
      )) {
        throw new Error('Ya existe una cuenta con este correo')
      }

      const payload = { ...data, email }
      const favorites = readJson<Record<string, string[]>>(FAVORITES_KEY, {})
      let updated: User
      let administrator: DbState['administrator']

      if (user.role === 'cliente') {
        updated = adaptClient(await api.updateClient(user.id, { ...payload, cityId }), db.banks, favorites)
      } else if (user.role === 'propietario') {
        updated = adaptOwner(await api.updateOwner(user.id, payload), db.banks, favorites)
      } else {
        const result = await api.updateAdministrator(payload)
        updated = adaptAdministratorUser(result, db.banks, favorites)
        administrator = adaptAdministrator(result)
      }

      if (email !== oldEmail) {
        const passwords = readJson<Record<string, string>>(PASSWORDS_KEY, {})
        if (passwords[oldEmail] !== undefined) {
          passwords[email] = passwords[oldEmail]
          delete passwords[oldEmail]
          writeJson(PASSWORDS_KEY, passwords)
        }
      }
      setDb((state) => ({
        ...state,
        users: state.users.map((candidate) => candidate.id === user.id ? updated : candidate),
        administrator: administrator ?? state.administrator,
      }))
      await refresh()
    },
    [db.banks, db.users, refresh, user],
  )

  const publish = useCallback(
    async (data: PropertyInput, propertyId?: string) => {
      if (!user || user.role !== 'propietario') {
        throw new Error('Inicia sesión como propietario para continuar')
      }

      const saved = propertyId
        ? await api.updateProperty(propertyId, {
            ownerId: user.id,
            address: data.address,
            area: data.area,
            numberOfRooms: data.numberOfRooms,
            capacity: data.capacity,
            price: data.price,
          })
        : await api.createProperty({
            ownerId: user.id,
            cityId: data.cityId,
            address: data.address,
            area: data.area,
            numberOfRooms: data.numberOfRooms,
            capacity: data.capacity,
            price: data.price,
          })

      const property = adaptProperty({
        ...saved,
        city: db.cities.find((city) => city.id === saved.cityId),
      })
      setDb((state) => ({
        ...state,
        properties: propertyId
          ? state.properties.map((candidate) => candidate.id === propertyId ? property : candidate)
          : [...state.properties, property],
      }))
      await refresh()
      return property
    },
    [db.cities, refresh, user],
  )

  const setPropertyStatus = useCallback(
    async (id: string, status: PropertyStatus) => {
      if (user?.role !== 'propietario') {
        throw new Error('Inicia sesión como propietario para continuar')
      }

      const saved = await api.updateProperty(id, { ownerId: user.id, status })
      setDb((state) => ({
        ...state,
        properties: state.properties.map((property) =>
          property.id === id
            ? { ...property, status: saved.status, manuallyInactive: saved.manuallyInactive }
            : property,
        ),
      }))
      await refresh()
    },
    [refresh, user],
  )

  const remove = useCallback(
    async (propertyId: string) => {
      if (!user || user.role !== 'propietario') {
        throw new Error('Inicia sesión como propietario para continuar')
      }

      await api.deleteProperty(propertyId, user.id)
      setDb((state) => ({
        ...state,
        properties: state.properties.filter((property) => property.id !== propertyId),
        bookings: state.bookings.filter((booking) => booking.property !== propertyId),
      }))
      await refresh()
    },
    [refresh, user],
  )

  const syncPropertyImages = useCallback(
    async (propertyId: string, removeIds: string[], files: File[]) => {
      if (!user || user.role !== 'propietario') {
        throw new Error('Inicia sesión como propietario para continuar')
      }

      const failures: string[] = []
      for (const imageId of removeIds) {
        try {
          await api.deletePropertyImage(propertyId, imageId, user.id)
        } catch (caught) {
          failures.push(caught instanceof Error ? caught.message : 'Error inesperado')
        }
      }
      // One by one, so the gallery keeps the order the owner chose
      for (const file of files) {
        try {
          await api.addPropertyImage(propertyId, user.id, file)
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : 'Error inesperado'
          failures.push(`${file.name}: ${message}`)
        }
      }

      if (removeIds.length || files.length) await refresh()
      return failures
    },
    [refresh, user],
  )

  const pay = useCallback(
    async (quote: Quote) => {
      if (!user || user.role !== 'cliente') {
        throw new Error('Las reservas requieren una cuenta de cliente')
      }

      const property = findProperty(db, quote.property)
      if (!property) throw new Error('Este inmueble no está disponible')

      const reservation = await api.createRental({
        propertyId: quote.property,
        clientId: user.id,
        startDate: quote.start,
        endDate: quote.end,
      })
      const booking = adaptReservation(reservation, property)

      setLastBooking(booking)
      setDb((state) => ({
        ...state,
        bookings: [...state.bookings.filter((item) => item.id !== booking.id), booking],
      }))
      await refresh()
      return booking
    },
    [db, refresh, user],
  )

  const cancelBooking = useCallback(
    async (booking: Booking) => {
      if (user?.role !== 'cliente' || user.id !== booking.user) {
        throw new Error('Solo puedes cancelar tus reservas')
      }

      await api.cancelRental(booking.property, user.id, booking.start)
      setDb((state) => ({
        ...state,
        bookings: state.bookings.filter((item) => item.id !== booking.id),
      }))
      setLastBooking((last) => last?.id === booking.id ? null : last)
      await refresh()
    },
    [refresh, user],
  )

  const toggleFavorite = useCallback(
    (propertyId: string) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')

      const favorites = readJson<Record<string, string[]>>(FAVORITES_KEY, {})
      const current = favorites[currentUserId] ?? []
      const next = current.includes(propertyId)
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId]

      writeJson(FAVORITES_KEY, { ...favorites, [currentUserId]: next })
      setDb((state) => ({
        ...state,
        users: state.users.map((candidate) =>
          candidate.id === currentUserId
            ? { ...candidate, favorites: next }
            : candidate,
        ),
      }))
    },
    [currentUserId],
  )

  const setFilters = useCallback((patch: Partial<Filters>) => {
    setFiltersState((current) => ({ ...current, ...patch }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(createDefaultFilters())
  }, [])

  const openModal = useCallback((nextModal: ModalState) => {
    setModal(nextModal)
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
  }, [])

  const requireLogin = useCallback(
    (next: LoginTarget = null) => {
      if (user) return true
      setModal({ type: 'login', next })
      return false
    },
    [user],
  )

  const value: BrisaContextValue = {
    db,
    user,
    filters,
    modal,
    toast,
    pendingQuote,
    lastBooking,
    loading,
    ready,
    error,
    refresh,
    login,
    logout,
    register,
    updateProfile,
    publish,
    setPropertyStatus,
    remove,
    syncPropertyImages,
    pay,
    cancelBooking,
    toggleFavorite,
    setFilters,
    resetFilters,
    setPendingQuote,
    setLastBooking,
    openModal,
    closeModal,
    requireLogin,
    showToast,
  }

  return <BrisaContext.Provider value={value}>{children}</BrisaContext.Provider>
}

export function useBrisa(): BrisaContextValue {
  const context = useContext(BrisaContext)

  if (!context) {
    throw new Error('useBrisa debe usarse dentro de BrisaProvider')
  }

  return context
}
