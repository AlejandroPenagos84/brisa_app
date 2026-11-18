import { translateApiError, type ApiErrorBody } from './errors'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
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
    let body: ApiErrorBody | null = null

    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = null
    }

    throw new Error(translateApiError(response.status, body))
  }

  const content = await response.text()
  return content ? (JSON.parse(content) as T) : (undefined as T)
}

export const apiConfig = {
  baseUrl: API_URL,
}
