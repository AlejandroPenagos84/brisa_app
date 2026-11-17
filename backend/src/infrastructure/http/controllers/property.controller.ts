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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyService } from '@/application/services/property-service.js';
import {
  PropertyResponse,
  PropertyDetailsResponse,
} from '../dto/response/property.response.js';
import { CreatePropertyRequest } from '../dto/request/create/create-property.request.js';
import { PropertyFiltersRequest } from '../dto/request/query/property-filters.request.js';
import { UpdatePropertyRequest } from '../dto/request/update/update-property.request.js';
import { PropertyHttpMapper } from '../mappers/property-http.mapper.js';

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

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
  @ApiOperation({ summary: 'Create a property' })
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
    const saved = await this.propertyService.create(command);
    return PropertyHttpMapper.fromDomainToResponse(saved);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({
    name: 'id',
    description: 'Property identifier',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Property updated', type: PropertyResponse })
  @ApiBadRequestResponse({ description: 'Invalid property data' })
  @ApiNotFoundResponse({ description: 'Property not found' })
  @ApiConflictResponse({
    description: 'Property has active or upcoming rentals and cannot be activated',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdatePropertyRequest,
  ): Promise<PropertyResponse> {
    const command = PropertyHttpMapper.fromUpdateRequestToCommand(request);
    const updated = await this.propertyService.update(id, command);
    return PropertyHttpMapper.fromDomainToResponse(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property' })
  @ApiParam({
    name: 'id',
    description: 'Property identifier',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Property deleted with its past rentals' })
  @ApiNotFoundResponse({ description: 'Property not found' })
  @ApiConflictResponse({
    description: 'Property has active or upcoming rentals',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.propertyService.delete(id);
  }
}
