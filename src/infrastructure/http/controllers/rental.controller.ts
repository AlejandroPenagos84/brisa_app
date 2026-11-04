import {
  Body,
  Controller,
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
import { CreateRentalRequest } from '../dto/request/create/create-rental.request.js';
import {
  RentalResponse,
  RentalDetailsResponse,
} from '../dto/response/rental.response.js';
import { RentalHttpMapper } from '../mappers/rental-http.mapper.js';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

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

    return rentals.map((item) =>
      RentalHttpMapper.fromDetailsToResponse(item),
    );
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

    return rentals.map((item) =>
      RentalHttpMapper.fromDetailsToResponse(item),
    );
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

  @Post()
  @ApiOperation({ summary: 'Create a rental' })
  @ApiCreatedResponse({ description: 'Rental created', type: RentalResponse })
  @ApiBadRequestResponse({ description: 'Invalid rental dates or data' })
  @ApiNotFoundResponse({ description: 'Client or property not found' })
  @ApiConflictResponse({ description: 'The rental already exists' })
  async create(@Body() request: CreateRentalRequest): Promise<RentalResponse> {
    const rental = RentalHttpMapper.fromCreateRequestToDomain(request);
    const saved = await this.rentalService.save(rental);
    return RentalHttpMapper.fromDomainToResponse(saved);
  }
}
