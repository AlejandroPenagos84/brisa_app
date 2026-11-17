import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseDatePipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RentalService } from '@/application/services/rental-service.js';
import { CancelRentalUseCase } from '@/application/use-cases/cancel-rental.use-case.js';
import { ReservePropertyUseCase } from '@/application/use-cases/reserve-property.use-case.js';
import { CreateRentalRequest } from '@/infrastructure/http/dto/request/create/create-rental.request.js';
import { RentalDetailsResponse } from '@/infrastructure/http/dto/response/rental.response.js';
import { ReservationResponse } from '@/infrastructure/http/dto/response/reservation.response.js';
import { RentalHttpMapper } from '@/infrastructure/http/mappers/rental-http.mapper.js';

// The client is part of the rental key, so cancelling another client's
// rental simply does not find it. Without login the client id is trusted:
// the app only runs on localhost.
@ApiTags('Rentals')
@Controller('rentals')
export class RentalController {
  constructor(
    private readonly rentalService: RentalService,
    private readonly reserveProperty: ReservePropertyUseCase,
    private readonly cancelRental: CancelRentalUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List rentals, optionally filtered by client' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filter rentals by client identifier',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'List of rentals with their property and client',
    type: [RentalDetailsResponse],
  })
  async findAll(
    @Query('clientId', new ParseUUIDPipe({ optional: true })) clientId?: string,
  ): Promise<RentalDetailsResponse[]> {
    const rentals = clientId
      ? await this.rentalService.findByClientId(clientId)
      : await this.rentalService.findAll();

    return rentals.map((item) => RentalHttpMapper.fromDetailsToResponse(item));
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'List rentals by client' })
  @ApiParam({
    name: 'clientId',
    description: 'Client identifier',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Rentals of the given client',
    type: [RentalDetailsResponse],
  })
  async findByClientId(
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<RentalDetailsResponse[]> {
    const rentals = await this.rentalService.findByClientId(clientId);

    return rentals.map((item) => RentalHttpMapper.fromDetailsToResponse(item));
  }

  @Get(':propertyId/:clientId/:startDate')
  @ApiOperation({ summary: 'Get a rental by its composite key' })
  @ApiParam({
    name: 'propertyId',
    description: 'Rented property identifier',
    format: 'uuid',
  })
  @ApiParam({
    name: 'clientId',
    description: 'Client identifier',
    format: 'uuid',
  })
  @ApiParam({
    name: 'startDate',
    description: 'Rental start date',
    example: '2026-11-10',
    format: 'date',
  })
  @ApiOkResponse({
    description: 'Rental found',
    type: RentalDetailsResponse,
  })
  @ApiNotFoundResponse({ description: 'Rental not found' })
  async findByKey(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('startDate', new ParseDatePipe()) startDate: Date,
  ): Promise<RentalDetailsResponse> {
    const details = await this.rentalService.findByKey({
      propertyId,
      clientId,
      startDate,
    });

    if (!details) {
      throw new NotFoundException('Rental not found');
    }

    return RentalHttpMapper.fromDetailsToResponse(details);
  }

  @Delete(':propertyId/:clientId/:startDate')
  @ApiOperation({
    summary:
      'Cancel a rental: the owner and the administrator give the whole cost back to the client bank account (simulated)',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'Rented property identifier',
    format: 'uuid',
  })
  @ApiParam({
    name: 'clientId',
    description: 'Client identifier',
    format: 'uuid',
  })
  @ApiParam({
    name: 'startDate',
    description: 'Rental start date',
    example: '2026-11-10',
    format: 'date',
  })
  @ApiOkResponse({ description: 'Rental cancelled and cost refunded' })
  @ApiNotFoundResponse({ description: 'Rental not found' })
  @ApiConflictResponse({
    description:
      'The rental has already started, has no cost, or the owner or administrator balance is not enough to refund it',
  })
  async cancel(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('startDate', new ParseDatePipe()) startDate: Date,
  ): Promise<void> {
    await this.cancelRental.execute({ propertyId, clientId, startDate });
  }

  @Post()
  @ApiOperation({
    summary:
      'Reserve a property (reservarInmueble): the client pays from its bank account (simulated, always approved), the administrator keeps 10% and the owner receives 90%',
  })
  @ApiCreatedResponse({
    description: 'Rental created with its payment receipt',
    type: ReservationResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid rental dates or data' })
  @ApiNotFoundResponse({ description: 'Client or property not found' })
  @ApiConflictResponse({
    description:
      'The property is not available for the dates, the client has an overlapping rental, or a balance would exceed the maximum',
  })
  async create(
    @Body() request: CreateRentalRequest,
  ): Promise<ReservationResponse> {
    const command = RentalHttpMapper.fromCreateRequestToCommand(request);
    const reservation = await this.reserveProperty.execute(command);
    return RentalHttpMapper.fromReservationToResponse(reservation);
  }
}
