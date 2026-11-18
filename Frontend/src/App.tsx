import { HashRouter, Route, Routes } from 'react-router-dom'
import { BrisaProvider } from './context/BrisaContext'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { PaymentPage } from './pages/PaymentPage'
import { OwnerPage } from './pages/OwnerPage'
import { PropertyFormPage } from './pages/PropertyFormPage'
import { WalletPage } from './pages/WalletPage'
import { BookingsPage } from './pages/BookingsPage'
import { AdminPage } from './pages/AdminPage'
import { SuccessPage } from './pages/SuccessPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <BrisaProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route
              path="/alojamiento/:id"
              element={<PropertyDetailPage />}
            />
            <Route path="/pago" element={<PaymentPage />} />
            <Route path="/propietario" element={<OwnerPage />} />
            <Route
              path="/propietario/nuevo"
              element={<PropertyFormPage />}
            />
            <Route
              path="/propietario/:id/editar"
              element={<PropertyFormPage />}
            />
            <Route path="/cuenta" element={<WalletPage />} />
            <Route path="/reservas" element={<BookingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="/reserva-confirmada"
              element={<SuccessPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </BrisaProvider>
  )
}
