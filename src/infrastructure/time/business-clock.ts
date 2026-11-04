import type { Clock } from '@/application/ports/out/clock.js';
import { businessTodayAsDate } from './business-date.js';

// Uses the business time zone (APP_TIME_ZONE, America/Bogota by default)
export class BusinessClock implements Clock {
  today(): Date {
    return businessTodayAsDate();
  }
}
