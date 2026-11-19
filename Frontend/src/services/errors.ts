// Translates the error responses of the Brisa API (which answers in English)
// into Spanish messages for the user. Unknown messages never reach the UI:
// they fall back to a generic Spanish message based on the HTTP status.

export interface ApiErrorBody {
  statusCode?: number
  code?: string
  message?: string | string[]
}

// Domain errors carry a stable code (backend: domain-error-codes.ts)
const DOMAIN_CODE_MESSAGES: Record<string, string> = {
  NAME_REQUIRED: 'El nombre es obligatorio',
  PHONE_REQUIRED: 'El teléfono es obligatorio',
  EMAIL_REQUIRED: 'El correo es obligatorio',
  INVALID_BANK: 'El banco no es válido',
  ACCOUNT_NUMBER_REQUIRED: 'El número de cuenta es obligatorio',
  ACCOUNT_TYPE_REQUIRED: 'El tipo de cuenta es obligatorio',

  INVALID_BALANCE: 'El saldo no es válido',
  INVALID_AMOUNT: 'El monto no es válido',
  BALANCE_LIMIT_EXCEEDED: 'El saldo supera el máximo permitido',
  INSUFFICIENT_BALANCE: 'No hay saldo suficiente para completar la operación',

  INVALID_CITY: 'La ciudad no es válida',
  CLIENT_HAS_OVERLAPPING_RENTAL:
    'Ya tienes una reserva activa o próxima que se cruza con estas fechas',
  CLIENT_HAS_ACTIVE_RENTALS: 'El cliente tiene reservas activas o próximas',

  PROPERTY_NOT_OWNED: 'Este inmueble no te pertenece',
  OWNER_HAS_ACTIVE_RENTALS:
    'Uno de los inmuebles del propietario tiene reservas activas o próximas',

  ADDRESS_REQUIRED: 'La dirección es obligatoria',
  INVALID_AREA: 'El área debe ser mayor que cero',
  INVALID_NUMBER_OF_ROOMS: 'El número de habitaciones no puede ser negativo',
  INVALID_CAPACITY: 'La capacidad debe ser mayor que cero',
  INVALID_PRICE: 'El precio debe ser mayor que cero',
  INVALID_PROPERTY_AVAILABILITY: 'La disponibilidad del inmueble no es válida',
  PROPERTY_NOT_AVAILABLE:
    'El inmueble no está disponible en las fechas seleccionadas',
  PROPERTY_HAS_ACTIVE_RENTALS: 'El inmueble tiene reservas activas o próximas',
  INVALID_PROPERTY_IMAGE: 'La imagen no es válida',
  PROPERTY_IMAGE_LIMIT_REACHED: 'Un inmueble puede tener máximo 10 imágenes',
  PROPERTY_IMAGE_NOT_FOUND: 'La imagen ya no existe en este inmueble',

  INVALID_PROPERTY: 'El inmueble no es válido',
  INVALID_CLIENT: 'El cliente no es válido',
  INVALID_RENTAL_DATES: 'Las fechas de la reserva no son válidas',
  END_DATE_NOT_AFTER_START_DATE:
    'La fecha de salida debe ser posterior a la de entrada',
  START_DATE_IN_PAST: 'La fecha de entrada no puede estar en el pasado',
  INVALID_CHARGED_AMOUNT: 'El costo de la reserva no es válido',
  INVALID_RENTAL_STATUS: 'El estado de la reserva no es válido',
  RENTAL_ALREADY_STARTED: 'La reserva ya comenzó y no se puede cancelar',
  RENTAL_HAS_NO_COST: 'La reserva no tiene un costo para reembolsar',

  PAYMENT_BANK_MISMATCH: 'El pago debe hacerse a través del banco del cliente',
  INVALID_TRANSACTION: 'La transacción no es válida',
}

// Messages without a code: use cases, database constraints and NestJS
const EXACT_MESSAGES: Record<string, string> = {
  'The email is already registered': 'Ya existe una cuenta con este correo',
  'The bank account is already registered':
    'Esta cuenta bancaria ya está registrada',
  'The rental already exists': 'Esta reserva ya existe',
  'The resource already exists': 'El registro ya existe',
  'The client has an overlapping active or upcoming rental':
    'Ya tienes una reserva activa o próxima que se cruza con estas fechas',
  'The property has an overlapping active or upcoming rental':
    'Estas fechas no están disponibles para este inmueble',
  'The requested dates overlap': 'Las fechas solicitadas se cruzan con otra reserva',
  'Rental not found': 'No se encontró la reserva',
  'Internal server error': 'Ocurrió un error en el servidor. Intenta de nuevo',
  'Only JPEG, PNG or WebP images are allowed':
    'Solo se permiten imágenes JPG, PNG o WebP',
  'The image file is required (field "file")': 'Selecciona una imagen',
  'File too large': 'La imagen supera el máximo de 5 MB',
}

const ENTITY_NAMES: Record<string, string> = {
  City: 'la ciudad',
  Bank: 'el banco',
  Client: 'el cliente',
  Owner: 'el propietario',
  Property: 'el inmueble',
  Country: 'el país',
}

// Request fields (backend DTOs) as the user knows them
const FIELD_NAMES: Record<string, string> = {
  name: 'nombre',
  phone: 'teléfono',
  email: 'correo',
  cityId: 'ciudad',
  bankId: 'banco',
  accountNumber: 'número de cuenta',
  accountType: 'tipo de cuenta',
  ownerId: 'propietario',
  clientId: 'cliente',
  propertyId: 'inmueble',
  countryId: 'país',
  address: 'dirección',
  area: 'área',
  numberOfRooms: 'habitaciones',
  capacity: 'capacidad',
  price: 'precio',
  minPrice: 'precio mínimo',
  maxPrice: 'precio máximo',
  status: 'estado',
  startDate: 'fecha de entrada',
  endDate: 'fecha de salida',
}

function field(name: string): string {
  return FIELD_NAMES[name] ?? name
}

// [pattern, translation] for class-validator defaults and NestJS pipes
const PATTERNS: Array<[RegExp, (...groups: string[]) => string]> = [
  [/^(\w+) with id \S+ not found$/, (entity) =>
    `No se encontró ${ENTITY_NAMES[entity] ?? 'el registro'}`],
  [/^property (\w+) should not exist$/, (name) =>
    `El campo «${field(name)}» no está permitido`],
  [/^(\w+) should not be empty$/, (name) =>
    `El campo «${field(name)}» es obligatorio`],
  [/^(\w+) must be an email$/, () => 'El correo no es válido'],
  [/^(\w+) must be a UUID$/, (name) => `El campo «${field(name)}» no es válido`],
  [/^(\w+) must be a string$/, (name) => `El campo «${field(name)}» debe ser texto`],
  [/^(\w+) must be an integer number$/, (name) =>
    `El campo «${field(name)}» debe ser un número entero`],
  [/^(\w+) must be a number conforming to the specified constraints$/, (name) =>
    `El campo «${field(name)}» debe ser un número con máximo 2 decimales`],
  [/^(\w+) must be a positive number$/, (name) =>
    `El campo «${field(name)}» debe ser mayor que cero`],
  [/^(\w+) must not be less than (\S+)$/, (name, min) =>
    `El campo «${field(name)}» no puede ser menor que ${min}`],
  [/^(\w+) must not be greater than (\S+)$/, (name, max) =>
    `El campo «${field(name)}» no puede ser mayor que ${max}`],
  [/^(\w+) must be shorter than or equal to (\d+) characters$/, (name, max) =>
    `El campo «${field(name)}» admite máximo ${max} caracteres`],
  [/^(\w+) must be longer than or equal to (\d+) characters$/, (name, min) =>
    `El campo «${field(name)}» debe tener al menos ${min} caracteres`],
  [/^(\w+) must be a valid ISO 8601 date string$/, (name) =>
    `La ${field(name)} no es válida`],
  [/^(\w+) must be one of the following values/, (name) =>
    `El valor del campo «${field(name)}» no es válido`],
  [/^Validation failed \(uuid .*expected\)$/, () => 'El identificador no es válido'],
  [/^Validation failed .*date/i, () => 'La fecha no es válida'],
  [/^Cannot (GET|POST|PATCH|PUT|DELETE) /, () => 'La operación solicitada no existe'],
]

function translateMessage(message: string): string | null {
  const exact = EXACT_MESSAGES[message.trim()]
  if (exact) return exact

  for (const [pattern, translate] of PATTERNS) {
    const match = pattern.exec(message.trim())
    if (match) return translate(...match.slice(1))
  }

  return null
}

export function messageForStatus(status: number): string {
  if (status === 400) return 'Revisa los datos ingresados'
  if (status === 403) return 'No tienes permiso para realizar esta acción'
  if (status === 404) return 'No se encontró la información solicitada'
  if (status === 409) return 'La operación no se puede completar con el estado actual'
  if (status === 413) return 'El archivo es demasiado grande'
  if (status >= 500) return 'Ocurrió un error en el servidor. Intenta de nuevo'
  return `La solicitud falló (código ${status})`
}

export function translateApiError(
  status: number,
  body: ApiErrorBody | null,
): string {
  if (body?.code && DOMAIN_CODE_MESSAGES[body.code]) {
    return DOMAIN_CODE_MESSAGES[body.code]
  }

  const messages = Array.isArray(body?.message)
    ? body.message
    : body?.message
      ? [body.message]
      : []

  const translated = messages
    .map(translateMessage)
    .filter((message): message is string => message !== null)

  // Only show messages we could translate; never untranslated English
  if (translated.length) {
    return Array.from(new Set(translated)).join('. ')
  }

  return messageForStatus(status)
}
