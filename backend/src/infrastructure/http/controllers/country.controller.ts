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
import { CountryService } from '@/application/services/country-service.js';
import { CountryResponse } from '../dto/response/country.response.js';
import { CountryHttpMapper } from '../mappers/country-http.mapper.js';

@ApiTags('Countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiOperation({ summary: 'List countries' })
  @ApiOkResponse({ description: 'List of countries', type: [CountryResponse] })
  async findAll(): Promise<CountryResponse[]> {
    const items = await this.countryService.findAll();
    return items.map((item) => CountryHttpMapper.fromDomainToResponse(item));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by id' })
  @ApiParam({
    name: 'id',
    description: 'Country identifier',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Country found', type: CountryResponse })
  @ApiNotFoundResponse({ description: 'Country not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CountryResponse> {
    const item = await this.countryService.findById(id);
    if (!item) {
      throw new NotFoundException(`Country with id ${id} not found`);
    }
    return CountryHttpMapper.fromDomainToResponse(item);
  }
}
