import { UUID } from '@/utils/types.js';

export class Owner {
  constructor(
    private readonly id: UUID,
    private name: string,
    private phone: string,
    private email: string,
    private bankId: UUID,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name.trim()) {
      throw new Error('The name is required');
    }

    if (!this.email.trim()) {
      throw new Error('The email is required');
    }

    if (!this.phone.trim()) {
      throw new Error('The phone is required');
    }

    if (!this.bankId.trim()) {
      throw new Error('The bank is not valid');
    }
  }

  changeName(name: string): void {
    if (!name.trim()) {
      throw new Error('The name is required');
    }

    this.name = name;
  }

  changePhone(phone: string): void {
    if (!phone.trim()) {
      throw new Error('The phone is required');
    }

    this.phone = phone;
  }

  changeEmail(email: string): void {
    if (!email.trim()) {
      throw new Error('The email is required');
    }

    this.email = email;
  }

  changeBank(bankId: UUID): void {
    if (!bankId.trim()) {
      throw new Error('The bank is not valid');
    }

    this.bankId = bankId;
  }

  getId(): UUID {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPhone(): string {
    return this.phone;
  }

  getEmail(): string {
    return this.email;
  }

  getBankId(): UUID {
    return this.bankId;
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      bankId: this.bankId,
    };
  }
}
