import { useNavigate } from 'react-router-dom'
import { useBrisa } from '../context/BrisaContext'
import { emptyRegistration } from '../components/forms/registration'

export function useAccountActions() {
  const {
    user,
    requireLogin,
    setFilters,
    openModal,
    logout,
    showToast,
  } = useBrisa()
  const navigate = useNavigate()

  function goHome() {
    navigate('/')
  }

  function goFavorites() {
    if (!requireLogin('favorites')) return
    setFilters({ favorites: true })
    navigate('/')
  }

  function goBookings() {
    if (!requireLogin('bookings')) return
    navigate('/reservas')
  }

  function goOwner() {
    if (!requireLogin('owner')) return
    navigate('/propietario')
  }

  function goWallet() {
    if (!requireLogin('wallet')) return
    navigate('/cuenta')
  }

  function goAdmin() {
    if (!requireLogin('admin')) return
    navigate('/admin')
  }

  function goPublish() {
    if (!requireLogin('owner')) return

    if (user?.role !== 'propietario') {
      showToast('Regístrate como propietario para publicar')
      return
    }

    navigate('/propietario/nuevo')
  }

  function handleLogout() {
    logout()
    setFilters({ favorites: false })
    navigate('/')
    showToast('Has cerrado sesión')
  }

  function openLogin() {
    openModal({ type: 'login' })
  }

  function openRegister() {
    openModal({ type: 'register', draft: emptyRegistration() })
  }

  return {
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
  }
}
