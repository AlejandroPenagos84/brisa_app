import { PartialType } from '@nestjs/swagger';
import { CreateRentalRequest } from '../create/create-rental.request.js';

export class UpdateRentalRequest extends PartialType(CreateRentalRequest) {}
