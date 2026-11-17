import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { AddPropertyUseCase } from '@/application/use-cases/add-property.use-case.js';
import { EditPropertyUseCase } from '@/application/use-cases/edit-property.use-case.js';
import { RemovePropertyUseCase } from '@/application/use-cases/remove-property.use-case.js';
import { CreatePropertyRequest } from '../dto/request/create/create-property.request.js';
import { UpdatePropertyRequest } from '../dto/request/update/update-property.request.js';
import { PropertyResponse } from '../dto/response/property.response.js';
import { PropertyHttpMapper } from '../mappers/property-http.mapper.js';

// The owner in the route is the one making the request. Only the owner of a
// property can edit or delete it (403 PROPERTY_NOT_OWNED otherwise).
// Without login the route is trusted: the app only runs on localhost.
@ApiTags('Owner properties')
@ApiParam({ name: 'ownerId', description: 'Owner identifier', format: 'uuid' })
@Controller('owners/:ownerId/properties')
export class OwnerPropertyController {
  constructor(
    private readonly addProperty: AddPropertyUseCase,
    private readonly editProperty: EditPropertyUseCase,
    private readonly removeProperty: RemovePropertyUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a property to the owner (agregarInmueble)' })
  @ApiCreatedResponse({
    description: 'Property created',
    type: PropertyResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid property data' })
  @ApiNotFoundResponse({ description: 'Owner or city not found' })
  async create(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Body() request: CreatePropertyRequest,
  ): Promise<PropertyResponse> {
    const command = PropertyHttpMapper.fromCreateRequestToCommand(
      ownerId,
      request,
    );
    const saved = await this.addProperty.execute(command);
    return PropertyHttpMapper.fromDomainToResponse(saved);
  }

  @Patch(':propertyId')
  @ApiOperation({ summary: 'Edit a property of the owner (editarInmueble)' })
  @ApiParam({
    name: 'propertyId',
    description: 'Property identifier',
    format: 'uuid',
  })
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
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() request: UpdatePropertyRequest,
  ): Promise<PropertyResponse> {
    const command = PropertyHttpMapper.fromUpdateRequestToCommand(request);
    const updated = await this.editProperty.execute(
      ownerId,
      propertyId,
      command,
    );
    return PropertyHttpMapper.fromDomainToResponse(updated);
  }

  @Delete(':propertyId')
  @ApiOperation({
    summary: 'Delete a property of the owner (eliminarInmueble)',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'Property identifier',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Property deleted with its past rentals' })
  @ApiForbiddenResponse({
    description: 'The property belongs to another owner',
  })
  @ApiNotFoundResponse({ description: 'Owner or property not found' })
  @ApiConflictResponse({
    description: 'Property has active or upcoming rentals',
  })
  async delete(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<void> {
    await this.removeProperty.execute(ownerId, propertyId);
  }
}
