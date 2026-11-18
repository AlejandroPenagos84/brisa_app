const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

interface ErrorBody {
  message?: string | string[]
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: body === undefined ? headers : {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor de Brisa')
  }

  if (!response.ok) {
    let message = `La solicitud falló con estado ${response.status}`

    try {
      const error = (await response.json()) as ErrorBody
      if (Array.isArray(error.message)) message = error.message.join('. ')
      else if (error.message) message = error.message
    } catch {
      message = `La solicitud falló con estado ${response.status}`
    }

    throw new Error(message)
  }

  const content = await response.text()
  return content ? (JSON.parse(content) as T) : (undefined as T)
}

export const apiConfig = {
  baseUrl: API_URL,
}
