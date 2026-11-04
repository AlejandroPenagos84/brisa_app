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
import { CityService } from '@/application/services/city-service.js';
import { CityDetailsResponse } from '../dto/response/city.response.js';
import { CityHttpMapper } from '../mappers/city-http.mapper.js';

@ApiTags('Cities')
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({ summary: 'List cities with their country' })
  @ApiOkResponse({
    description: 'List of cities',
    type: [CityDetailsResponse],
  })
  async findAll(): Promise<CityDetailsResponse[]> {
    const items = await this.cityService.findAll();
    return items.map((item) => CityHttpMapper.fromDetailsToResponse(item));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a city by id' })
  @ApiParam({
    name: 'id',
    description: 'City identifier',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'City found', type: CityDetailsResponse })
  @ApiNotFoundResponse({ description: 'City not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CityDetailsResponse> {
    const item = await this.cityService.findById(id);
    if (!item) {
      throw new NotFoundException(`City with id ${id} not found`);
    }
    return CityHttpMapper.fromDetailsToResponse(item);
  }
}
