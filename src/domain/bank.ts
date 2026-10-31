import { UUID } from '@/utils/types.js';

export class Bank {
  constructor(
    private readonly id: UUID,
    private name: string,
    private countryId: string,
  ) {}

  getData() {
    return {
      id: this.id,
      name: this.name,
      countryId: this.countryId,
    };
  }
}
