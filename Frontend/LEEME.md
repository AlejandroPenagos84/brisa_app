# brisa · Frontend en React

Aplicación frontend de **brisa**, reconstruida en React + TypeScript a partir
del prototipo interactivo generado por Figma. Conserva las pantallas, el
diseño, los recursos visuales y los flujos del original.

## Ejecutar

Requiere Node.js 20.19 o superior.

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. Scripts disponibles:

- `npm run dev` · servidor de desarrollo.
- `npm run build` · validación de tipos y compilación de producción en `dist/`.
- `npm run preview` · vista previa de la compilación.
- `npm run typecheck` · validación de TypeScript.
- `npm test` · pruebas del dominio.

## Demo

- Cliente: `juan@brisa.co`
- Propietario: `ana@brisa.co`
- Contraseña: `Brisa123`

Los datos viven en memoria y se reinician al recargar, igual que en el
prototipo original.

## Estructura

```text
src/
  components/
    forms/       Campos y formularios reutilizables
    layout/      Header, footer, navegación y layout
    modals/      Diálogos de autenticación, pagos y acciones
    ui/          Componentes compartidos de interfaz
  context/       Estado global y sesión simulada
  data/          Datos de demostración
  domain/        Reglas de negocio puras y pruebas
  hooks/         Acciones de navegación por rol
  pages/         Vistas de la aplicación
  services/      Cliente HTTP preparado para el backend
  styles/        Estilos globales
  types/         Tipos del dominio
```

## Integración futura con el backend

La lógica de negocio está separada de la presentación en `src/domain`. Los
datos de demostración se concentran en `src/data` y el estado global en
`src/context`. `src/services/http.ts` y `.env.example` dejan preparado el
cliente HTTP y la variable `VITE_API_URL` para conectar la API cuando esté
disponible.
