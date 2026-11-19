import type { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';

// Only a plain file name: no folders, so it can never point outside the
// property's image folder. The bytes live in the ImageStorage port
const FILE_NAME_PATTERN = /^[\w-]+\.(jpg|jpeg|png|webp)$/i;

// Value object inside the Property aggregate. Position 0 is the cover
export class PropertyImage {
  constructor(
    private readonly id: UUID,
    private readonly fileName: string,
    private readonly position: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || !FILE_NAME_PATTERN.test(this.fileName)) {
      throw new DomainError(
        DomainErrorCode.INVALID_PROPERTY_IMAGE,
        'The property image is not valid',
      );
    }

    if (!Number.isInteger(this.position) || this.position < 0) {
      throw new DomainError(
        DomainErrorCode.INVALID_PROPERTY_IMAGE,
        'The image position must be a non-negative integer',
      );
    }
  }

  withPosition(position: number): PropertyImage {
    return new PropertyImage(this.id, this.fileName, position);
  }

  getId(): UUID {
    return this.id;
  }

  getFileName(): string {
    return this.fileName;
  }

  getPosition(): number {
    return this.position;
  }

  getData() {
    return {
      id: this.id,
      fileName: this.fileName,
      position: this.position,
    };
  }
}
