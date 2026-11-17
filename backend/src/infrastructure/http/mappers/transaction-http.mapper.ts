import type { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import type { TransactionResponse } from '@/infrastructure/http/dto/response/transaction.response.js';

export class TransactionHttpMapper {
  static fromDomainToResponse(
    transaction: AdministratorTransaction,
  ): TransactionResponse {
    const data = transaction.getData();
    return {
      id: data.id,
      administratorId: data.administratorId,
      ownerId: data.ownerId,
      type: data.type,
      grossAmount: data.grossAmount,
      commission: data.commission,
      netAmount: data.netAmount,
      createdAt: data.createdAt,
    };
  }
}
