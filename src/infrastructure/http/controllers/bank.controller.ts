import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BankService } from '@/application/services/bank-service.js';
import { BankDetailsResponse } from '../dto/response/bank.response.js';
import { BankHttpMapper } from '../mappers/bank-http.mapper.js';

@ApiTags('Banks')
@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get()
  @ApiOperation({ summary: 'List banks with their country' })
  @ApiOkResponse({
    description: 'List of banks',
    type: [BankDetailsResponse],
  })
  async findAll(): Promise<BankDetailsResponse[]> {
    const items = await this.bankService.findAll();
    return items.map((item) => BankHttpMapper.fromDetailsToResponse(item));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank by id' })
  @ApiParam({
    name: 'id',
    description: 'Bank identifier',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Bank found', type: BankDetailsResponse })
  @ApiNotFoundResponse({ description: 'Bank not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BankDetailsResponse> {
    const item = await this.bankService.findById(id);
    if (!item) {
      throw new NotFoundException(`Bank with id ${id} not found`);
    }
    return BankHttpMapper.fromDetailsToResponse(item);
  }
}
