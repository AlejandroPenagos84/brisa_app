import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RentalService } from '@/application/services/rental-service.js';
import { businessTimeZone } from '@/infrastructure/time/business-date.js';

@Injectable()
export class RentalStatusScheduler {
  private readonly logger = new Logger(RentalStatusScheduler.name);

  constructor(private readonly rentalService: RentalService) {}

  // Midnight in the business time zone, when the calendar day changes
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: businessTimeZone() })
  async refreshRentalStatuses(): Promise<void> {
    const updated = await this.rentalService.refreshAllStatuses();

    if (updated > 0) {
      this.logger.log(`Rental statuses refreshed: ${updated} updated`);
    }
  }
}
