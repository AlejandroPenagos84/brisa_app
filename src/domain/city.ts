export class City {
  constructor(
    private readonly id: string,
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
