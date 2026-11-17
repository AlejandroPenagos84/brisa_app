import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyService } from '@/application/services/property-service.js';
import { AddPropertyUseCase } from '@/application/use-cases/add-property.use-case.js';
import { EditPropertyUseCase } from '@/application/use-cases/edit-property.use-case.js';
import { RemovePropertyUseCase } from '@/application/use-cases/remove-property.use-case.js';
import {
  PropertyResponse,
  PropertyDetailsResponse,
} from '@/infrastructure/http/dto/response/property.response.js';
import { CreatePropertyRequest } from '@/infrastructure/http/dto/request/create/create-property.request.js';
import { OwnerActionRequest } from '@/infrastructure/http/dto/request/query/owner-action.request.js';
import { PropertyFiltersRequest } from '@/infrastructure/http/dto/request/query/property-filters.request.js';
import { UpdatePropertyRequest } from '@/infrastructure/http/dto/request/update/update-property.request.js';
import { PropertyHttpMapper } from '@/infrastructure/http/mappers/property-http.mapper.js';

// Writes receive the owner making the request (ownerId): only the owner of
// a property can edit or delete it (403 PROPERTY_NOT_OWNED otherwise).
// Without login it is trusted: the app only runs on localhost.
@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly addProperty: AddPropertyUseCase,
    private readonly editProperty: EditPropertyUseCase,
    private readonly removeProperty: RemovePropertyUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List properties, optionally filtered by city, country or price',
  })
  @ApiOkResponse({
    description: 'List of properties',
    type: [PropertyDetailsResponse],
  })
  async findAll(
    @Query() filters: PropertyFiltersRequest,
  ): Promise<PropertyDetailsResponse[]> {
    const hasFilters =
      filters.cityId !== undefined ||
      filters.countryId !== undefined ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined;

    const properties = hasFilters
      ? await this.propertyService.findByFilters(filters)
      : await this.propertyService.findAll();

    return properties.map((item) =>
      PropertyHttpMapper.fromDetailsToResponse(item),
    );
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'List properties by owner' })
  @ApiParam({
    name: 'ownerId',
    description: 'Owner identifier',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Properties owned by the given owner',
    type: [PropertyDetailsResponse],
  })
  async findByOwnerId(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
  ): Promise<PropertyDetailsResponse[]> {
    const properties = await this.propertyService.findByOwnerId(ownerId);
    return properties.map((item) =>
      PropertyHttpMapper.fromDetailsToResponse(item),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property by id' })
  @ApiParam({
    name: 'id',
    description: 'Property identifier',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Property found',
    type: PropertyDetailsResponse,
  })
  @ApiNotFoundResponse({ description: 'Property not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PropertyDetailsResponse> {
    const details = await this.propertyService.findById(id);
    if (!details) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    return PropertyHttpMapper.fromDetailsToResponse(details);
  }

  @Post()
  @ApiOperation({ summary: 'Add a property to an owner (agregarInmueble)' })
  @ApiCreatedResponse({
    description: 'Property created',
    type: PropertyResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid property data' })
  @ApiNotFoundResponse({ description: 'Owner or city not found' })
  async create(
    @Body() request: CreatePropertyRequest,
  ): Promise<PropertyResponse> {
    const command = PropertyHttpMapper.fromCreateRequestToCommand(request);
    const saved = await this.addProperty.execute(command);
    return PropertyHttpMapper.fromDomainToResponse(saved);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit a property (editarInmueble), only by its owner',
  })
  @ApiParam({ name: 'id', description: 'Property identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Property updated', type: PropertyResponse })
  @ApiBadRequestResponse({ description: 'Invalid property data' })
  @ApiForbiddenResponse({
    description: 'The property belongs to another owner',
  })
  @ApiNotFoundResponse({ description: 'Owner or property not found' })
  @ApiConflictResponse({
    description:
      'Property has active or upcoming rentals and cannot be activated',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdatePropertyRequest,
  ): Promise<PropertyResponse> {
    const command = PropertyHttpMapper.fromUpdateRequestToCommand(request);
    const updated = await this.editProperty.execute(
      request.ownerId,
      id,
      command,
    );
    return PropertyHttpMapper.fromDomainToResponse(updated);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a property (eliminarInmueble), only by its owner',
  })
  @ApiParam({ name: 'id', description: 'Property identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Property deleted with its past rentals' })
  @ApiForbiddenResponse({
    description: 'The property belongs to another owner',
  })
  @ApiNotFoundResponse({ description: 'Owner or property not found' })
  @ApiConflictResponse({
    description: 'Property has active or upcoming rentals',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: OwnerActionRequest,
  ): Promise<void> {
    await this.removeProperty.execute(query.ownerId, id);
  }
}
