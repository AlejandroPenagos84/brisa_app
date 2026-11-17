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
import { OwnerService } from '@/application/services/owner-service.js';
import { CreateOwnerUseCase } from '@/application/use-cases/create-owner.use-case.js';
import { DeleteOwnerUseCase } from '@/application/use-cases/delete-owner.use-case.js';
import { UpdateOwnerUseCase } from '@/application/use-cases/update-owner.use-case.js';
import { CreateOwnerRequest } from '@/infrastructure/http/dto/request/create/create-owner.request.js';
import { UpdateOwnerRequest } from '@/infrastructure/http/dto/request/update/update-owner.request.js';
import {
  OwnerEarningsResponse,
  OwnerTransactionsResponse,
} from '@/infrastructure/http/dto/response/owner-earnings.response.js';
import { OwnerResponse } from '@/infrastructure/http/dto/response/owner.response.js';
import { OwnerHttpMapper } from '@/infrastructure/http/mappers/owner-http.mapper.js';

// The owner balance only changes through rental payments: there are no
// deposit or withdraw endpoints
@ApiTags('Owners')
@Controller('owners')
export class OwnerController {
  constructor(
    private readonly ownerService: OwnerService,
    private readonly createOwner: CreateOwnerUseCase,
    private readonly updateOwner: UpdateOwnerUseCase,
    private readonly deleteOwner: DeleteOwnerUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List owners' })
  @ApiOkResponse({ description: 'List of owners', type: [OwnerResponse] })
  async findAll(): Promise<OwnerResponse[]> {
    const owners = await this.ownerService.findAll();
    return owners.map((owner) => OwnerHttpMapper.fromDomainToResponse(owner));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an owner by id' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Owner found', type: OwnerResponse })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OwnerResponse> {
    const owner = await this.ownerService.findById(id);
    if (!owner) {
      throw new NotFoundException(`Owner with id ${id} not found`);
    }
    return OwnerHttpMapper.fromDomainToResponse(owner);
  }

  @Get(':id/earnings')
  @ApiOperation({
    summary: 'Total earned by an owner (net payments minus net refunds)',
  })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Owner earnings', type: OwnerEarningsResponse })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  async getEarnings(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OwnerEarningsResponse> {
    const earnings = await this.ownerService.getEarnings(id);
    return OwnerHttpMapper.fromEarningsToResponse(earnings);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Payments and refunds of an owner, newest first' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Owner transactions',
    type: OwnerTransactionsResponse,
  })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  async getTransactions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OwnerTransactionsResponse> {
    const detail = await this.ownerService.getTransactions(id);
    return OwnerHttpMapper.fromTransactionsToResponse(detail);
  }

  @Post()
  @ApiOperation({ summary: 'Create an owner' })
  @ApiCreatedResponse({
    description: 'Owner created with its bank summary',
    type: OwnerResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid owner data' })
  @ApiNotFoundResponse({ description: 'Bank not found' })
  @ApiConflictResponse({
    description: 'Email or bank account already registered',
  })
  async create(@Body() request: CreateOwnerRequest): Promise<OwnerResponse> {
    const command = OwnerHttpMapper.fromCreateRequestToCommand(request);
    const { owner, bank } = await this.createOwner.execute(command);
    return OwnerHttpMapper.fromDomainWithBankToResponse(owner, bank);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owner' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Owner updated', type: OwnerResponse })
  @ApiBadRequestResponse({ description: 'Invalid owner data' })
  @ApiNotFoundResponse({ description: 'Owner or bank not found' })
  @ApiConflictResponse({
    description: 'Email or bank account already registered',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdateOwnerRequest,
  ): Promise<OwnerResponse> {
    const command = OwnerHttpMapper.fromUpdateRequestToCommand(request);
    const owner = await this.updateOwner.execute(id, command);
    return OwnerHttpMapper.fromDomainToResponse(owner);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete an owner with its properties and transactions (the administrator balance is kept)',
  })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Owner deleted' })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  @ApiConflictResponse({
    description: 'A property of the owner has active or upcoming rentals',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteOwner.execute(id);
  }
}
