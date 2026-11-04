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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { UpdatePropertyRequest } from '../dto/request/update/update-property.request.js';
import { PropertyHttpMapper } from '../mappers/property-http.mapper.js';

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  @ApiOperation({ summary: 'List properties with their owner and city' })
  @ApiOkResponse({
    description: 'List of properties',
    type: [PropertyDetailsResponse],
  })
  async findAll(): Promise<PropertyDetailsResponse[]> {
    const properties = await this.propertyService.findAll();
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
  @ApiOkResponse({ description: 'Delete request processed' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.propertyService.delete(id);
  }
}
