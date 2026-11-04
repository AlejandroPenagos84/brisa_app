import { PartialType } from '@nestjs/swagger';
import { CreateBankRequest } from '../create/create-bank.request.js';

export class UpdateBankRequest extends PartialType(CreateBankRequest) {}
