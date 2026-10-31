export class Country {
  constructor(
    private readonly id: string,
    private name: string,
  ) {}

  getData() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
