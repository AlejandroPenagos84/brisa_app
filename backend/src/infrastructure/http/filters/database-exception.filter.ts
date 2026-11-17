import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

export interface DatabaseErrorResponse {
  statusCode: number;
  message: string;
}

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {
  uq_owners_email_lower: 'The email is already registered',
  uq_clients_email_lower: 'The email is already registered',
  uq_clients_bank_account: 'The bank account is already registered',
  rentals_pkey: 'The rental already exists',
};

export function mapDatabaseError(
  error: unknown,
): DatabaseErrorResponse | null {
  if (!(error instanceof QueryFailedError)) return null;

  const driverError = error.driverError as
    | PostgresDriverError
    | undefined;

  if (!driverError) return null;

  const constraint = driverError.constraint?.toLowerCase();

  if (driverError.code === '23505') {
    const message =
      constraint !== undefined
        ? UNIQUE_CONSTRAINT_MESSAGES[constraint]
        : undefined;

    return {
      statusCode: HttpStatus.CONFLICT,
      message: message ?? 'The resource already exists',
    };
  }

  if (driverError.code === '23P01') {
    if (constraint === 'excl_rentals_client_period') {
      return {
        statusCode: HttpStatus.CONFLICT,
        message:
          'The client has an overlapping active or upcoming rental',
      };
    }

    if (constraint === 'excl_rentals_property_period') {
      return {
        statusCode: HttpStatus.CONFLICT,
        message:
          'The property has an overlapping active or upcoming rental',
      };
    }

    return {
      statusCode: HttpStatus.CONFLICT,
      message: 'The requested dates overlap',
    };
  }

  return null;
}

@Catch(QueryFailedError)
export class DatabaseExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const mapped = mapDatabaseError(exception);

    if (!mapped) {
      super.catch(exception, host);
      return;
    }

    const response = host.switchToHttp().getResponse<Response>();
    response.status(mapped.statusCode).json(mapped);
  }
}
