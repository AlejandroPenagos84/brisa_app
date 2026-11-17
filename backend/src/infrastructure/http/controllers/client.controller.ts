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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ClientService } from '@/application/services/client-service.js';
import { UpdateClientUseCase } from '@/application/use-cases/update-client.use-case.js';
import { CreateClientRequest } from '@/infrastructure/http/dto/request/create/create-client.request.js';
import { UpdateClientRequest } from '@/infrastructure/http/dto/request/update/update-client.request.js';
import {
  ClientResponse,
  ClientDetailsResponse,
} from '@/infrastructure/http/dto/response/client.response.js';
import { ClientHttpMapper } from '@/infrastructure/http/mappers/client-http.mapper.js';

// The client balance only changes through rentals: it pays when it
// reserves and gets the money back when it cancels
@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly updateClient: UpdateClientUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List clients with their bank and country' })
  @ApiOkResponse({
    description: 'List of clients',
    type: [ClientDetailsResponse],
  })
  async findAll(): Promise<ClientDetailsResponse[]> {
    const clients = await this.clientService.findAll();
    return clients.map((item) => ClientHttpMapper.fromDetailsToResponse(item));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiParam({ name: 'id', description: 'Client identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Client found',
    type: ClientDetailsResponse,
  })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientDetailsResponse> {
    const details = await this.clientService.findById(id);
    if (!details) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return ClientHttpMapper.fromDetailsToResponse(details);
  }

  @Post()
  @ApiOperation({ summary: 'Create a client' })
  @ApiCreatedResponse({ description: 'Client created', type: ClientResponse })
  @ApiBadRequestResponse({ description: 'Invalid client data' })
  @ApiNotFoundResponse({ description: 'City or bank not found' })
  @ApiConflictResponse({
    description: 'Email or bank account already registered',
  })
  async create(@Body() request: CreateClientRequest): Promise<ClientResponse> {
    const command = ClientHttpMapper.fromCreateRequestToCommand(request);
    const saved = await this.clientService.create(command);
    return ClientHttpMapper.fromDomainToBasicResponse(saved);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Client updated', type: ClientResponse })
  @ApiBadRequestResponse({ description: 'Invalid client data' })
  @ApiNotFoundResponse({ description: 'Client, city or bank not found' })
  @ApiConflictResponse({
    description: 'Email or bank account already registered',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdateClientRequest,
  ): Promise<ClientResponse> {
    const command = ClientHttpMapper.fromUpdateRequestToCommand(request);
    const updated = await this.updateClient.execute(id, command);
    return ClientHttpMapper.fromDomainToBasicResponse(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Client deleted with finished rentals' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiConflictResponse({
    description: 'Client has active or upcoming rentals',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.clientService.delete(id);
  }
}
