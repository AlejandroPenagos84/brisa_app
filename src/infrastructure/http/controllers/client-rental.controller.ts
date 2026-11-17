import {
  Body,
  Controller,
  Delete,
  Param,
  ParseDatePipe,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CancelRentalUseCase } from '@/application/use-cases/cancel-rental.use-case.js';
import { ReservePropertyUseCase } from '@/application/use-cases/reserve-property.use-case.js';
import { CreateRentalRequest } from '../dto/request/create/create-rental.request.js';
import { RentalResponse } from '../dto/response/rental.response.js';
import { RentalHttpMapper } from '../mappers/rental-http.mapper.js';

// The client in the route is the one making the request: it reserves and
// pays with its own balance, and only it can cancel its rentals. The client
// is part of the rental key, so another client's rental is simply not found.
// Without login the route is trusted: the app only runs on localhost.
@ApiTags('Client rentals')
@ApiParam({
  name: 'clientId',
  description: 'Client identifier',
  format: 'uuid',
})
@Controller('clients/:clientId/rentals')
export class ClientRentalController {
  constructor(
    private readonly reserveProperty: ReservePropertyUseCase,
    private readonly cancelRental: CancelRentalUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Reserve a property (reservarInmueble): the client pays, the administrator keeps 10% and the owner receives 90%',
  })
  @ApiCreatedResponse({ description: 'Rental created', type: RentalResponse })
  @ApiBadRequestResponse({ description: 'Invalid rental dates or data' })
  @ApiNotFoundResponse({ description: 'Client or property not found' })
  @ApiConflictResponse({
    description:
      'The property is not available for the dates, the client has an overlapping rental or insufficient balance, or a balance would exceed the maximum',
  })
  async create(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() request: CreateRentalRequest,
  ): Promise<RentalResponse> {
    const command = RentalHttpMapper.fromCreateRequestToCommand(
      clientId,
      request,
    );
    const rental = await this.reserveProperty.execute(command);
    return RentalHttpMapper.fromDomainToResponse(rental);
  }

  @Delete(':propertyId/:startDate')
  @ApiOperation({
    summary:
      'Cancel a rental of the client: it recovers the whole cost (owner net amount + administrator commission)',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'Rented property identifier',
    format: 'uuid',
  })
  @ApiParam({
    name: 'startDate',
    description: 'Rental start date',
    example: '2026-11-10',
    format: 'date',
  })
  @ApiOkResponse({ description: 'Rental cancelled and cost refunded' })
  @ApiNotFoundResponse({ description: 'Rental not found for this client' })
  @ApiConflictResponse({
    description:
      'The rental has already started, has no cost, or the owner or administrator balance is not enough to refund it',
  })
  async cancel(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('startDate', new ParseDatePipe()) startDate: Date,
  ): Promise<void> {
    await this.cancelRental.execute({ propertyId, clientId, startDate });
  }
}
