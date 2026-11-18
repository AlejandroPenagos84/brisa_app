import { useBrisa } from '../../context/BrisaContext'
import { useAccountActions } from '../../hooks/useAccountActions'

export function MobileNav() {
  const { user } = useBrisa()
  const {
    goHome,
    goFavorites,
    goBookings,
    goOwner,
    goWallet,
    goAdmin,
  } = useAccountActions()

  const isOwner = user?.role === 'propietario'
  const isAdmin = user?.role === 'administrador'

  return (
    <nav id="nav">
      <button type="button" onClick={goHome}>
        ⌕ Explorar
      </button>
      {isAdmin ? (
        <button type="button" onClick={goAdmin}>
          ⚙ Panel
        </button>
      ) : (
        <button type="button" onClick={goFavorites}>
          ♡ Favoritos
        </button>
      )}
      {!isAdmin ? (
        <button
          type="button"
          onClick={isOwner ? goOwner : goBookings}
        >
          {isOwner ? '⌂ Mis inmuebles' : '▣ Mis reservas'}
        </button>
      ) : null}
      <button type="button" onClick={goWallet}>
        ☰ Mi cuenta
      </button>
    </nav>
  )
}
