import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { OwnerService } from '@/application/owner-service.js';
import { CreateOwnerRequest } from '@/infrastructure/http/dto/create-owner.request.js';
import { OwnerResponse } from '@/infrastructure/http/dto/owner.response.js';
import { OwnerHttpMapper } from '@/infrastructure/http/mappers/owner-http.mapper.js';

@Controller('owners')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get()
  async findAll(): Promise<OwnerResponse[]> {
    const owners = await this.ownerService.findAll();
    return owners.map((owner) => OwnerHttpMapper.fromDomainToResponse(owner));
  }

  @Get(':id')
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
  async create(@Body() request: CreateOwnerRequest): Promise<OwnerResponse> {
    const command = OwnerHttpMapper.fromCreateRequestToCommand(request);
    const owner = await this.ownerService.create(command);
    return OwnerHttpMapper.fromDomainToResponse(owner);
  }
}
