import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdministratorService } from '@/application/services/administrator-service.js';
import { UpdateAdministratorUseCase } from '@/application/use-cases/update-administrator.use-case.js';
import { UpdateAdministratorRequest } from '../dto/request/update/update-administrator.request.js';
import { AdministratorResponse } from '../dto/response/administrator.response.js';
import { TransactionResponse } from '../dto/response/transaction.response.js';
import { AdministratorHttpMapper } from '../mappers/administrator-http.mapper.js';
import { TransactionHttpMapper } from '../mappers/transaction-http.mapper.js';

// There is a single administrator, so the routes have no id
@ApiTags('Administrator')
@Controller('administrator')
export class AdministratorController {
  constructor(
    private readonly administratorService: AdministratorService,
    private readonly updateAdministrator: UpdateAdministratorUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get the administrator and its commissions balance',
  })
  @ApiOkResponse({ description: 'Administrator', type: AdministratorResponse })
  async get(): Promise<AdministratorResponse> {
    const administrator = await this.administratorService.get();
    return AdministratorHttpMapper.fromDomainToResponse(administrator);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the administrator contact data or account' })
  @ApiOkResponse({
    description: 'Administrator updated',
    type: AdministratorResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid administrator data' })
  @ApiNotFoundResponse({ description: 'Bank not found' })
  async update(
    @Body() request: UpdateAdministratorRequest,
  ): Promise<AdministratorResponse> {
    const command = AdministratorHttpMapper.fromUpdateRequestToCommand(request);
    const administrator = await this.updateAdministrator.execute(command);
    return AdministratorHttpMapper.fromDomainToResponse(administrator);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Every payment and refund, newest first' })
  @ApiOkResponse({ description: 'Transactions', type: [TransactionResponse] })
  async getTransactions(): Promise<TransactionResponse[]> {
    const transactions = await this.administratorService.getTransactions();
    return transactions.map((transaction) =>
      TransactionHttpMapper.fromDomainToResponse(transaction),
    );
  }
}
