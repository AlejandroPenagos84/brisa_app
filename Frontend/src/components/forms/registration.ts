import { createRegistrationDraft } from '../../domain/brisa'
import type { AccountInput, RegistrationDraft } from '../../types'

export const EMPTY_ACCOUNT: AccountInput = {
  bank: 'Bancolombia',
  type: 'Ahorros',
  number: '',
}

export function emptyRegistration(role: RegistrationDraft['role'] = 'cliente') {
  return createRegistrationDraft(role)
}
