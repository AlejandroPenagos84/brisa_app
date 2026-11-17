import { useBrisa } from '../../context/BrisaContext'

export function ToastHost() {
  const { toast } = useBrisa()

  if (!toast) return null

  return (
    <div id="toast" role="status">
      {toast}
    </div>
  )
}
