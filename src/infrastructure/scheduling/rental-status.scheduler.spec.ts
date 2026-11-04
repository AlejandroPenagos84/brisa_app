import { vi } from 'vitest';
import { RentalService } from '@/application/services/rental-service.js';
import { RentalStatusScheduler } from './rental-status.scheduler.js';

describe('RentalStatusScheduler', () => {
  it('refreshes all rental statuses', async () => {
    const service = {
      refreshAllStatuses: vi.fn().mockResolvedValue(2),
    };
    const scheduler = new RentalStatusScheduler(
      service as unknown as RentalService,
    );

    await scheduler.refreshRentalStatuses();

    expect(service.refreshAllStatuses).toHaveBeenCalledOnce();
  });
});
