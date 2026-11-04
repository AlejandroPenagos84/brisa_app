import { PartialType } from '@nestjs/swagger';
import { CreateCountryRequest } from '../create/create-country.request.js';

export class UpdateCountryRequest extends PartialType(CreateCountryRequest) {}
