import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyService } from '@/application/services/property-service.js';
import { PropertyDetailsResponse } from '../dto/response/property.response.js';
import { PropertyFiltersRequest } from '../dto/request/query/property-filters.request.js';
import { PropertyHttpMapper } from '../mappers/property-http.mapper.js';

// Reads only. Creating, editing and deleting a property is done by its
// owner: OwnerPropertyController (/owners/:ownerId/properties)
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
}
