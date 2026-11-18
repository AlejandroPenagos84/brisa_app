import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useBrisa } from '../../context/BrisaContext'
import { ModalHost } from '../modals/ModalHost'
import { ToastHost } from '../ui/ToastHost'
import { Button } from '../ui/Button'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

export function Layout() {
  const location = useLocation()
  const { ready, loading, error, refresh } = useBrisa()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!reducedMotion && mainRef.current) {
      mainRef.current.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 180, easing: 'ease-out' },
      )
    }
  }, [location.pathname])

  return (
    <>
      <Header />
      <main id="app" ref={mainRef}>
        {ready ? <Outlet /> : loading ? (
          <p role="status">Cargando datos de Brisa…</p>
        ) : (
          <div className="notice">
            <p role="alert">{error}</p>
            <Button onClick={() => void refresh()}>Reintentar conexión</Button>
          </div>
        )}
      </main>
      <Footer />
      <MobileNav />
      <ModalHost />
      <ToastHost />
    </>
  )
}
