import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '@/domain/errors/domain-error.js';
import { DomainErrorCode } from '@/domain/errors/domain-error-codes.js';

export interface DomainErrorResponse {
  statusCode: number;
  code: DomainErrorCode;
  message: string;
}

// Rules that depend on the current state of the aggregate, not on the input
// alone. Any other domain error is an invalid input (400).
const CONFLICT_CODES: ReadonlySet<DomainErrorCode> = new Set<DomainErrorCode>([
  DomainErrorCode.INSUFFICIENT_BALANCE,
  DomainErrorCode.BALANCE_LIMIT_EXCEEDED,
  DomainErrorCode.CLIENT_HAS_OVERLAPPING_RENTAL,
  DomainErrorCode.CLIENT_HAS_ACTIVE_RENTALS,
  DomainErrorCode.OWNER_HAS_ACTIVE_RENTALS,
  DomainErrorCode.PROPERTY_NOT_AVAILABLE,
  DomainErrorCode.PROPERTY_HAS_ACTIVE_RENTALS,
  DomainErrorCode.RENTAL_ALREADY_STARTED,
  DomainErrorCode.RENTAL_HAS_NO_COST,
  DomainErrorCode.PAYMENT_BANK_MISMATCH,
  DomainErrorCode.PROPERTY_IMAGE_LIMIT_REACHED,
]);

// The domain looked for something inside the aggregate and it is not there
const NOT_FOUND_CODES: ReadonlySet<DomainErrorCode> = new Set<DomainErrorCode>([
  DomainErrorCode.PROPERTY_IMAGE_NOT_FOUND,
]);

// The rule is about who makes the request, not about the state
const FORBIDDEN_CODES: ReadonlySet<DomainErrorCode> = new Set<DomainErrorCode>([
  DomainErrorCode.PROPERTY_NOT_OWNED,
]);

function statusFor(code: DomainErrorCode): HttpStatus {
  if (FORBIDDEN_CODES.has(code)) return HttpStatus.FORBIDDEN;
  if (NOT_FOUND_CODES.has(code)) return HttpStatus.NOT_FOUND;
  if (CONFLICT_CODES.has(code)) return HttpStatus.CONFLICT;
  return HttpStatus.BAD_REQUEST;
}

export function mapDomainError(error: DomainError): DomainErrorResponse {
  return {
    statusCode: statusFor(error.code),
    code: error.code,
    message: error.message,
  };
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const mapped = mapDomainError(exception);
    const response = host.switchToHttp().getResponse<Response>();
    response.status(mapped.statusCode).json(mapped);
  }
}
