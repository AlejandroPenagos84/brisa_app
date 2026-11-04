// Keep explicit nulls and zeroes; only undefined means an omitted PATCH field.
export function omitUndefined<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as T;
}

export function trimText(value: string): string;
export function trimText(value: string | undefined): string | undefined;
export function trimText(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeEmail(value: string): string;
export function normalizeEmail(value: string | undefined): string | undefined;
export function normalizeEmail(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function toDate(value: string): Date;
export function toDate(value: string | undefined): Date | undefined;
export function toDate(value: string | undefined): Date | undefined {
  return typeof value === 'string' ? new Date(value) : value;
}
