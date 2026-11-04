import { UUID } from '@/utils/types.js';

export class Bank {
  constructor(
    private readonly id: UUID,
    private name: string,
    private countryId: string,
  ) {}

  getId(): UUID {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCountryId(): string {
    return this.countryId;
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
      countryId: this.countryId,
    };
  }
}
