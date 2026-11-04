// Rental dates are calendar days ('2026-11-10'), so "today" must be the
// calendar day where the business operates, not the UTC day. Otherwise a
// rental would start at 19:00 of the previous day in Colombia (UTC-5).
const DEFAULT_TIME_ZONE = 'America/Bogota';

export function businessTimeZone(): string {
  return process.env.APP_TIME_ZONE ?? DEFAULT_TIME_ZONE;
}

// 'YYYY-MM-DD' in the business time zone, the same format as DATE columns
export function businessToday(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: businessTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// Same day as businessToday(), at UTC midnight, the representation the
// domain uses for rental dates
export function businessTodayAsDate(now: Date = new Date()): Date {
  return new Date(`${businessToday(now)}T00:00:00.000Z`);
}
