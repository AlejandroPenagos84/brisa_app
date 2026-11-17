const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`La solicitud falló con estado ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const apiConfig = {
  baseUrl: API_URL,
}
