import { PartialType } from '@nestjs/swagger';
import { CreateClientRequest } from '@/infrastructure/http/dto/request/create/create-client.request.js';

export class UpdateClientRequest extends PartialType(CreateClientRequest) {}
