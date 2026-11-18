import { useBrisa } from '../../context/BrisaContext'
import { CannotRemoveModal } from './CannotRemoveModal'
import { CancelBookingModal } from './CancelBookingModal'
import { ConfirmPaymentModal } from './ConfirmPaymentModal'
import { DiscardChangesModal } from './DiscardChangesModal'
import { LoginModal } from './LoginModal'
import { RegisterBankModal } from './RegisterBankModal'
import { RegisterModal } from './RegisterModal'
import { RegisterSuccessModal } from './RegisterSuccessModal'
import { RemovePropertyModal } from './RemovePropertyModal'

export function ModalHost() {
  const { modal } = useBrisa()

  if (!modal) return null

  switch (modal.type) {
    case 'login':
      return <LoginModal next={modal.next} />
    case 'register':
      return <RegisterModal draft={modal.draft} />
    case 'register-bank':
      return <RegisterBankModal draft={modal.draft} />
    case 'register-success':
      return <RegisterSuccessModal />
    case 'confirm-payment':
      return <ConfirmPaymentModal total={modal.total} />
    case 'cancel-booking':
      return <CancelBookingModal booking={modal.booking} />
    case 'discard-changes':
      return <DiscardChangesModal />
    case 'remove-property':
      return <RemovePropertyModal propertyId={modal.propertyId} />
    case 'cannot-remove':
      return <CannotRemoveModal />
    default:
      return null
  }
}
