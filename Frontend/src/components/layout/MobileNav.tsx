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
  } = useAccountActions()

  const isOwner = user?.role === 'propietario'

  return (
    <nav id="nav">
      <button type="button" onClick={goHome}>
        ⌕ Explorar
      </button>
      <button type="button" onClick={goFavorites}>
        ♡ Favoritos
      </button>
      <button type="button" onClick={isOwner ? goOwner : goBookings}>
        {isOwner ? '⌂ Mis inmuebles' : '▣ Mis reservas'}
      </button>
      <button type="button" onClick={goWallet}>
        ☰ Mi cuenta
      </button>
    </nav>
  )
}
