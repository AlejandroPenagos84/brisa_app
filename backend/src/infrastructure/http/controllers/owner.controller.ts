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
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OwnerService } from '@/application/services/owner-service.js';
import { AmountRequest } from '@/infrastructure/http/dto/request/update/amount.request.js';
import { CreateOwnerRequest } from '@/infrastructure/http/dto/request/create/create-owner.request.js';
import { UpdateOwnerRequest } from '@/infrastructure/http/dto/request/update/update-owner.request.js';
import { OwnerResponse } from '@/infrastructure/http/dto/response/owner.response.js';
import { OwnerHttpMapper } from '@/infrastructure/http/mappers/owner-http.mapper.js';

@ApiTags('Owners')
@Controller('owners')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

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

  @Post()
  @ApiOperation({ summary: 'Create an owner' })
  @ApiCreatedResponse({
    description: 'Owner created with its bank summary',
    type: OwnerResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid owner data' })
  @ApiNotFoundResponse({ description: 'Bank not found' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async create(@Body() request: CreateOwnerRequest): Promise<OwnerResponse> {
    const command = OwnerHttpMapper.fromCreateRequestToCommand(request);
    const { owner, bank } = await this.ownerService.create(command);
    return OwnerHttpMapper.fromDomainWithBankToResponse(owner, bank);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owner' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Owner updated', type: OwnerResponse })
  @ApiBadRequestResponse({ description: 'Invalid owner data' })
  @ApiNotFoundResponse({ description: 'Owner or bank not found' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdateOwnerRequest,
  ): Promise<OwnerResponse> {
    const command = OwnerHttpMapper.fromUpdateRequestToCommand(request);
    const owner = await this.ownerService.update(id, command);
    return OwnerHttpMapper.fromDomainToResponse(owner);
  }

  @Patch(':id/deposit')
  @ApiOperation({ summary: 'Deposit money into an owner account' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiBody({ type: AmountRequest })
  @ApiOkResponse({
    description: 'Deposit applied and owner returned',
    type: OwnerResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid amount' })
  @ApiConflictResponse({
    description: 'The balance exceeds the maximum allowed',
  })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  async deposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: AmountRequest,
  ): Promise<OwnerResponse> {
    const owner = await this.ownerService.deposit(id, request.amount);
    return OwnerHttpMapper.fromDomainToResponse(owner);
  }

  @Patch(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw money from an owner account' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiBody({ type: AmountRequest })
  @ApiOkResponse({
    description: 'Withdrawal applied and owner returned',
    type: OwnerResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid amount' })
  @ApiConflictResponse({ description: 'Insufficient balance' })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: AmountRequest,
  ): Promise<OwnerResponse> {
    const owner = await this.ownerService.withdraw(id, request.amount);
    return OwnerHttpMapper.fromDomainToResponse(owner);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an owner' })
  @ApiParam({ name: 'id', description: 'Owner identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Owner deleted' })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  @ApiConflictResponse({ description: 'Owner has properties' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const deleted = await this.ownerService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Owner with id ${id} not found`);
    }
  }
}
