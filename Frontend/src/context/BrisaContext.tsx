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
import { createSeedDb } from '../data/seed'
import {
  addAccountToUser,
  createDefaultFilters,
  createUser,
  depositToAccount,
  loginUser,
  payForBooking,
  publishProperty,
  removeProperty,
  toggleFavoriteProperty,
} from '../domain/brisa'
import type {
  AccountInput,
  Booking,
  DbState,
  Filters,
  LoginTarget,
  ModalState,
  Property,
  PropertyInput,
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
  login: (email: string, password: string) => User
  logout: () => void
  register: (data: RegistrationDraft, account: AccountInput) => User
  addAccount: (account: AccountInput) => void
  deposit: (accountId: number, amount: number) => void
  publish: (data: PropertyInput, propertyId?: number) => Property
  remove: (propertyId: number) => void
  pay: (quote: Quote, accountId: number) => Booking
  toggleFavorite: (propertyId: number) => void
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

export function BrisaProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbState>(createSeedDb)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [filters, setFiltersState] = useState<Filters>(createDefaultFilters)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingQuote, setPendingQuote] = useState<Quote | null>(null)
  const [lastBooking, setLastBooking] = useState<Booking | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const user = useMemo(
    () => db.users.find((candidate) => candidate.id === currentUserId) ?? null,
    [db.users, currentUserId],
  )

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
    (email: string, password: string) => {
      const foundUser = loginUser(db, email, password)
      setCurrentUserId(foundUser.id)
      return foundUser
    },
    [db],
  )

  const logout = useCallback(() => {
    setCurrentUserId(null)
    setPendingQuote(null)
    setModal(null)
    setFiltersState((current) => ({ ...current, favorites: false }))
  }, [])

  const register = useCallback(
    (data: RegistrationDraft, account: AccountInput) => {
      const result = createUser(db, data, account)
      setDb(result.db)
      return result.user
    },
    [db],
  )

  const addAccount = useCallback(
    (account: AccountInput) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')
      const result = addAccountToUser(db, currentUserId, account)
      setDb(result.db)
    },
    [db, currentUserId],
  )

  const deposit = useCallback(
    (accountId: number, amount: number) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')
      setDb(depositToAccount(db, currentUserId, accountId, amount))
    },
    [db, currentUserId],
  )

  const publish = useCallback(
    (data: PropertyInput, propertyId?: number) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')
      const result = publishProperty(db, currentUserId, data, propertyId)
      setDb(result.db)
      return result.property
    },
    [db, currentUserId],
  )

  const remove = useCallback(
    (propertyId: number) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')
      setDb(removeProperty(db, currentUserId, propertyId))
    },
    [db, currentUserId],
  )

  const pay = useCallback(
    (quote: Quote, accountId: number) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')
      const result = payForBooking(db, currentUserId, quote, accountId)
      setDb(result.db)
      setLastBooking(result.booking)
      return result.booking
    },
    [db, currentUserId],
  )

  const toggleFavorite = useCallback(
    (propertyId: number) => {
      if (!currentUserId) throw new Error('Inicia sesión para continuar')
      setDb(toggleFavoriteProperty(db, currentUserId, propertyId))
    },
    [db, currentUserId],
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
      if (currentUserId !== null) return true
      setModal({ type: 'login', next })
      return false
    },
    [currentUserId],
  )

  const value: BrisaContextValue = {
    db,
    user,
    filters,
    modal,
    toast,
    pendingQuote,
    lastBooking,
    login,
    logout,
    register,
    addAccount,
    deposit,
    publish,
    remove,
    pay,
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
