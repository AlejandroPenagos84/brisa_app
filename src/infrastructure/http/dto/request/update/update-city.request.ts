import { PartialType } from '@nestjs/swagger';
import { CreateCityRequest } from '../create/create-city.request.js';

export class UpdateCityRequest extends PartialType(CreateCityRequest) {}
