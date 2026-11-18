import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { userLabel } from '../../domain/brisa'
import { useAccountActions } from '../../hooks/useAccountActions'
import { Button } from '../ui/Button'

export function Header() {
  const { user } = useBrisa()
  const {
    goHome,
    goFavorites,
    goBookings,
    goOwner,
    goWallet,
    goAdmin,
    goPublish,
    handleLogout,
    openLogin,
    openRegister,
  } = useAccountActions()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    menuRef.current?.querySelector('button')?.focus()

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function run(action: () => void) {
    setMenuOpen(false)
    action()
  }

  const avatar = user
    ? `${user.name.charAt(0)}${user.surname.charAt(0)}`
    : '○'

  return (
    <header>
      <button type="button" className="brand" onClick={goHome}>
        ≋ brisa
      </button>
      <button type="button" className="pill" onClick={goHome}>
        ¿A dónde quieres ir?{' '}
        <span> · Cualquier semana · Huéspedes</span> ⌕
      </button>
      <div id="user" ref={accountRef}>
        <div className="account-nav">
          <button
            ref={triggerRef}
            type="button"
            id="account-trigger"
            className="account-trigger"
            aria-label="Abrir menú de usuario"
            aria-expanded={menuOpen}
            aria-controls="account-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
            <span className="avatar" aria-hidden="true">
              {avatar}
            </span>
          </button>
          {menuOpen ? (
            <div
              ref={menuRef}
              id="account-menu"
              className="account-menu"
              role="group"
              aria-label="Mi cuenta"
            >
              {user ? (
                <div className="menu-name">
                  {user.name}
                  <small>{userLabel(user.role)}</small>
                </div>
              ) : null}
              {user ? (
                user.role === 'propietario' ? (
                  <>
                    <Button onClick={() => run(goOwner)}>Mis inmuebles</Button>
                    <Button onClick={() => run(goPublish)}>
                      Poner inmueble en renta
                    </Button>
                  </>
                ) : user.role === 'administrador' ? (
                  <>
                    <Button onClick={() => run(goAdmin)}>
                      Panel de administración
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => run(goBookings)}>
                      Mis reservas
                    </Button>
                    <Button onClick={() => run(goFavorites)}>
                      Favoritos
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Button onClick={() => run(openLogin)}>
                    Iniciar sesión
                  </Button>
                  <Button onClick={() => run(openRegister)}>
                    Registrarme
                  </Button>
                </>
              )}
              {user ? (
                <>
                  <Button onClick={() => run(goWallet)}>
                    Mi cuenta bancaria
                  </Button>
                  <hr />
                  <Button onClick={() => run(handleLogout)}>
                    Cerrar sesión
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
