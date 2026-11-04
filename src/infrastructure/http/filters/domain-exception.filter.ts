import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
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
const CONFLICT_CODES: ReadonlySet<DomainErrorCode> = new Set([
  DomainErrorCode.INSUFFICIENT_BALANCE,
  DomainErrorCode.BALANCE_LIMIT_EXCEEDED,
  DomainErrorCode.PROPERTY_ALREADY_ACTIVE,
  DomainErrorCode.PROPERTY_ALREADY_INACTIVE,
]);

export function mapDomainError(error: DomainError): DomainErrorResponse {
  const statusCode = CONFLICT_CODES.has(error.code)
    ? HttpStatus.CONFLICT
    : HttpStatus.BAD_REQUEST;

  return { statusCode, code: error.code, message: error.message };
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const mapped = mapDomainError(exception);
    const response = host.switchToHttp().getResponse<Response>();
    response.status(mapped.statusCode).json(mapped);
  }
}
