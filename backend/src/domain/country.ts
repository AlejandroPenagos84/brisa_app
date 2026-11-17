export class Country {
  constructor(
    private readonly id: string,
    private name: string,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
