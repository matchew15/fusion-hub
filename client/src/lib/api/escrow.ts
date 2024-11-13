import { fetcher } from '../fetcher';
import type { EscrowTransaction } from '../../../server/db/schema';

interface CreateEscrowParams {
  sellerId: number;
  amount: number;
  memo: string;
  releaseConditions: string;
}

export interface EscrowPaymentResponse {
  transaction: EscrowTransaction;
  payment: {
    identifier: string;
    amount: number;
    memo: string;
    metadata: Record<string, any>;
  };
}

export const escrowApi = {
  createTransaction: async (params: CreateEscrowParams): Promise<EscrowPaymentResponse> => {
    const response = await fetcher.post('/api/escrow/transactions', params);
    return response.json();
  },

  releaseFunds: async (transactionId: number): Promise<{ transaction: EscrowTransaction }> => {
    const response = await fetcher.post(`/api/escrow/transactions/${transactionId}/release`);
    return response.json();
  },

  initiateDispute: async (transactionId: number, reason: string): Promise<{ transaction: EscrowTransaction }> => {
    const response = await fetcher.post(`/api/escrow/transactions/${transactionId}/dispute`, { reason });
    return response.json();
  },

  getTransaction: async (transactionId: number): Promise<{ transaction: EscrowTransaction }> => {
    const response = await fetcher.get(`/api/escrow/transactions/${transactionId}`);
    return response.json();
  }
};
