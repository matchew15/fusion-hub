import { useState } from 'react';
import { escrowApi, type EscrowPaymentResponse } from '../lib/api/escrow';
import { piHelper } from '../lib/pi-helper';
import { useUser } from './use-user';

interface EscrowError {
  code?: string;
  message: string;
  details?: any;
}

interface UseEscrowState {
  isLoading: boolean;
  error: EscrowError | null;
}

export function useEscrow() {
  const [state, setState] = useState<UseEscrowState>({
    isLoading: false,
    error: null
  });

  const { user } = useUser();

  const createEscrowTransaction = async ({
    sellerId,
    amount,
    memo,
    releaseConditions
  }: {
    sellerId: number;
    amount: number;
    memo: string;
    releaseConditions: string;
  }) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setState({ isLoading: true, error: null });

    try {
      // Create escrow transaction through API
      const { transaction, payment } = await escrowApi.createTransaction({
        sellerId,
        amount,
        memo,
        releaseConditions
      });

      // Initialize Pi SDK for payment
      await piHelper.init();

      // Handle the payment through Pi SDK
      await piHelper.createPayment({
        amount: payment.amount,
        memo: payment.memo,
        metadata: {
          transactionId: transaction.id,
          type: 'escrow'
        }
      });

      setState({ isLoading: false, error: null });
      return { transaction, payment };
    } catch (error: any) {
      const formattedError: EscrowError = {
        code: error.code || 'ESCROW_ERROR',
        message: error.message || 'Failed to create escrow transaction',
        details: error.details
      };

      setState({ isLoading: false, error: formattedError });
      throw formattedError;
    }
  };

  const releaseFunds = async (transactionId: number) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setState({ isLoading: true, error: null });

    try {
      const result = await escrowApi.releaseFunds(transactionId);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error: any) {
      const formattedError: EscrowError = {
        code: error.code || 'RELEASE_ERROR',
        message: error.message || 'Failed to release funds',
        details: error.details
      };

      setState({ isLoading: false, error: formattedError });
      throw formattedError;
    }
  };

  const initiateDispute = async (transactionId: number, reason: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setState({ isLoading: true, error: null });

    try {
      const result = await escrowApi.initiateDispute(transactionId, reason);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error: any) {
      const formattedError: EscrowError = {
        code: error.code || 'DISPUTE_ERROR',
        message: error.message || 'Failed to initiate dispute',
        details: error.details
      };

      setState({ isLoading: false, error: formattedError });
      throw formattedError;
    }
  };

  return {
    isLoading: state.isLoading,
    error: state.error,
    createEscrowTransaction,
    releaseFunds,
    initiateDispute
  };
}
