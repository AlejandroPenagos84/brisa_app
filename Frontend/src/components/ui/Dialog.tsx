import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { useBrisa } from '../../context/BrisaContext'

interface DialogProps {
  children: ReactNode
  wide?: boolean
}

export function Dialog({ children, wide = false }: DialogProps) {
  const { closeModal } = useBrisa()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) {
      dialog.showModal()
    }

    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeModal()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={wide ? 'wide' : undefined}
      onMouseDown={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault()
        closeModal()
      }}
    >
      <button
        type="button"
        className="close"
        aria-label="Cerrar"
        onClick={closeModal}
      >
        ×
      </button>
      {children}
    </dialog>
  )
}
