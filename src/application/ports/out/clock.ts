export const CLOCK = Symbol('Clock');

// Tells the use cases which calendar day it is. The time zone is an
// infrastructure concern, so the application only receives the day.
export interface Clock {
  // Current business day at UTC midnight, the same representation as the
  // rental start and end dates
  today(): Date;
}
