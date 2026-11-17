import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApplicationError,
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';

export interface ApplicationErrorResponse {
  statusCode: number;
  message: string;
}

export function mapApplicationError(
  error: ApplicationError,
): ApplicationErrorResponse | null {
  if (error instanceof NotFoundError) {
    return { statusCode: HttpStatus.NOT_FOUND, message: error.message };
  }

  if (error instanceof ConflictError) {
    return { statusCode: HttpStatus.CONFLICT, message: error.message };
  }

  return null;
}

@Catch(ApplicationError)
export class ApplicationExceptionFilter
  implements ExceptionFilter<ApplicationError>
{
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = mapApplicationError(exception) ?? {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };

    response.status(mapped.statusCode).json(mapped);
  }
}
