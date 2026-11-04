import { HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { mapDatabaseError } from './database-exception.filter.js';

const makeError = (driverError: {
  code?: string;
  constraint?: string;
}) => new QueryFailedError('query', [], driverError);

describe('mapDatabaseError', () => {
  it('maps a duplicate owner email to conflict', () => {
    expect(
      mapDatabaseError(
        makeError({
          code: '23505',
          constraint: 'UQ_owners_email_lower',
        }),
      ),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message: 'The email is already registered',
    });
  });

  it('maps a duplicate client email to conflict', () => {
    expect(
      mapDatabaseError(
        makeError({
          code: '23505',
          constraint: 'UQ_clients_email_lower',
        }),
      ),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message: 'The email is already registered',
    });
  });

  it('maps a duplicate bank account to conflict', () => {
    expect(
      mapDatabaseError(
        makeError({
          code: '23505',
          constraint: 'UQ_clients_bank_account',
        }),
      ),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message: 'The bank account is already registered',
    });
  });

  it('maps a duplicate rental key to conflict', () => {
    expect(
      mapDatabaseError(
        makeError({ code: '23505', constraint: 'rentals_pkey' }),
      ),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message: 'The rental already exists',
    });
  });

  it('maps an unknown unique violation to a generic conflict', () => {
    expect(
      mapDatabaseError(makeError({ code: '23505' })),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message: 'The resource already exists',
    });
  });

  it('maps a property overlap to conflict', () => {
    expect(
      mapDatabaseError(
        makeError({
          code: '23P01',
          constraint: 'EXCL_rentals_property_period',
        }),
      ),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message:
        'The property has an overlapping active or upcoming rental',
    });
  });

  it('maps a client overlap to conflict', () => {
    expect(
      mapDatabaseError(
        makeError({
          code: '23P01',
          constraint: 'EXCL_rentals_client_period',
        }),
      ),
    ).toEqual({
      statusCode: HttpStatus.CONFLICT,
      message:
        'The client has an overlapping active or upcoming rental',
    });
  });

  it('returns null for unrelated errors', () => {
    expect(mapDatabaseError(new Error('boom'))).toBeNull();
  });
});
