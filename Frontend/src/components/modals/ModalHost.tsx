import { useBrisa } from '../../context/BrisaContext'
import { AddAccountModal } from './AddAccountModal'
import { CannotRemoveModal } from './CannotRemoveModal'
import { ConfirmPaymentModal } from './ConfirmPaymentModal'
import { DepositModal } from './DepositModal'
import { DiscardChangesModal } from './DiscardChangesModal'
import { InsufficientFundsModal } from './InsufficientFundsModal'
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
    case 'deposit':
      return <DepositModal />
    case 'add-account':
      return <AddAccountModal />
    case 'confirm-payment':
      return (
        <ConfirmPaymentModal
          accountId={modal.accountId}
          total={modal.total}
        />
      )
    case 'insufficient-funds':
      return <InsufficientFundsModal />
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
