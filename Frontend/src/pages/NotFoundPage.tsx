import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="empty">
      <h2>Página no encontrada</h2>
      <p className="muted">La página que buscas no está disponible.</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Volver al inicio
      </Button>
    </div>
  )
}
