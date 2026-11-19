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
  // FormData goes as is: the browser sets the multipart Content-Type with
  // its boundary
  const isForm = body instanceof FormData
  const isJson = body !== undefined && !isForm

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: isJson
        ? { 'Content-Type': 'application/json', ...headers }
        : headers,
      body: isForm ? body : isJson ? JSON.stringify(body) : undefined,
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

// The API returns file URLs relative to its origin (/uploads/...)
export function apiAssetUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`
}
