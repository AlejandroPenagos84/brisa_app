export class City {
  constructor(
    private readonly id: string,
    private name: string,
    private countryId: string,
  ) {}

  getId(): string {
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
