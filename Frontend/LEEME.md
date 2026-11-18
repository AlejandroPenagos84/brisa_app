# brisa · Frontend en React

Aplicación frontend de **brisa**, reconstruida en React + TypeScript a partir
del prototipo interactivo generado por Figma. Conserva las pantallas, el
diseño, los recursos visuales y los flujos del original.

## Ejecutar

Requiere Node.js 20.19 o superior para el frontend. Configura las variables
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` del backend.
Inicializa una base de datos PostgreSQL de desarrollo con `backend/script.sql`.
Si usas `backend/compose.yaml`, PostgreSQL ejecuta ese script al crear el volumen.

Desde `backend/`, ejecuta `pnpm install` y `pnpm run start:dev`.
La API escucha en el puerto 3000 de forma predeterminada y Swagger está en
`http://localhost:3000/docs`.

Desde `Frontend/`, copia `.env.example` a `.env` y ejecuta:

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. Si cambias el puerto o el host de la API, ajusta
`VITE_API_URL` a la dirección base de NestJS. Para autorizar un origen remoto
o HTTPS, configura `FRONTEND_ORIGINS` en el backend con los orígenes permitidos
separados por comas. Configura `VITE_APP_TIME_ZONE` y `APP_TIME_ZONE` con la
misma zona si la operación se realiza fuera de Bogotá.

Scripts disponibles:

- `npm run dev` · servidor de desarrollo.
- `npm run build` · validación de tipos y compilación de producción en `dist/`.
- `npm run preview` · vista previa de la compilación.
- `npm run typecheck` · validación de TypeScript.
- `npm test` · pruebas del dominio.

## Demo

- Cliente: `sofia.ramirez@example.com`
- Propietario: `ana.gomez@example.com`
- Administrador: `admin@brisa.example.com`
- Contraseña: `Brisa123`

Las cuentas de ejemplo se crean con el script de la base de datos. Al iniciar
sesión como administrador, el menú dirige al panel `/#/admin`. El inicio de
sesión es una simulación del navegador y las rutas de NestJS carecen de
autenticación y autorización. Usa el entorno con datos de demostración.
Los favoritos y la sesión se guardan en el navegador.

## Estructura

```text
src/
  components/
    forms/       Campos y formularios reutilizables
    layout/      Header, footer, navegación y layout
    modals/      Diálogos de autenticación, pagos y acciones
    ui/          Componentes compartidos de interfaz
  context/       Estado global y sesión simulada
  data/          Credenciales de demostración
  domain/        Adaptadores, filtros, cotizaciones y pruebas
  hooks/         Acciones de navegación por rol
  pages/         Vistas de la aplicación
  services/      Cliente HTTP y contratos de la API
  styles/        Estilos globales
  types/         Tipos del dominio
```

## Endpoints usados por el frontend

| Flujo | Endpoints |
| --- | --- |
| Catálogos | `GET /countries`, `GET /cities`, `GET /banks` |
| Clientes | `GET /clients`, `POST /clients`, `PATCH /clients/:id` |
| Propietarios | `GET /owners`, `POST /owners`, `PATCH /owners/:id`, `GET /owners/:id/earnings`, `GET /owners/:id/transactions` |
| Inmuebles | `GET /properties`, `POST /properties`, `PATCH /properties/:id`, `DELETE /properties/:id?ownerId=…` |
| Reservas | `GET /rentals`, `POST /rentals`, `DELETE /rentals/:propertyId/:clientId/:startDate` |
| Administración | `GET /administrator`, `PATCH /administrator`, `GET /administrator/transactions` |

Los pagos y devoluciones se simulan en el backend. El comprobante muestra el
monto aprobado y el historial usa el importe guardado de la reserva. Las fotos
del catálogo son ilustrativas. La cantidad introducida de huéspedes se usa para
comprobar la capacidad antes de reservar.
