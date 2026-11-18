import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { userLabel } from '../../domain/brisa'
import { useAccountActions } from '../../hooks/useAccountActions'
import { Button } from '../ui/Button'

export function Header() {
  const { user, filters, setFilters } = useBrisa()
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
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState(filters.q)
  const accountRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Keep the box in sync when the home search or "Limpiar filtros" change it
  useEffect(() => {
    setQuery(filters.q)
  }, [filters.q])

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

  function applySearch(value: string) {
    setFilters({ q: value.trim(), favorites: false })
    if (location.pathname !== '/') navigate('/')
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applySearch(query)
    // Bring the results into view once the catalog renders
    requestAnimationFrame(() =>
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }),
    )
  }

  const avatar = user
    ? `${user.name.charAt(0)}${user.surname.charAt(0)}`
    : '○'

  return (
    <header>
      <button type="button" className="brand" onClick={goHome}>
        ≋ brisa
      </button>
      <form className="pill header-search" role="search" onSubmit={handleSearch}>
        <input
          type="search"
          name="header-q"
          aria-label="Buscar destino o palabra clave"
          placeholder="¿A dónde quieres ir?"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            // Clearing the box with the native "x" also clears the results
            if (!event.target.value && filters.q) applySearch('')
          }}
        />
        <button type="submit" aria-label="Buscar">
          ⌕
        </button>
      </form>
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
