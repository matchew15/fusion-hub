import React, { useState } from 'react';
import { useEscrow } from '../hooks/use-escrow';
import { useUser } from '../hooks/use-user';
import type { EscrowTransaction as EscrowTransactionType } from '../../server/db/schema';

interface EscrowTransactionProps {
  transaction?: EscrowTransactionType;
  onCreateSuccess?: (transaction: EscrowTransactionType) => void;
  onError?: (error: Error) => void;
}

export function EscrowTransaction({
  transaction,
  onCreateSuccess,
  onError
}: EscrowTransactionProps) {
  const { user } = useUser();
  const { isLoading, error, createEscrowTransaction, releaseFunds, initiateDispute } = useEscrow();

  const [formData, setFormData] = useState({
    amount: '',
    memo: '',
    releaseConditions: '',
    disputeReason: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const result = await createEscrowTransaction({
        sellerId: user.id,
        amount: parseFloat(formData.amount),
        memo: formData.memo,
        releaseConditions: formData.releaseConditions
      });
      onCreateSuccess?.(result.transaction);
    } catch (err: any) {
      onError?.(err);
    }
  };

  const handleReleaseFunds = async () => {
    if (!transaction) return;
    try {
      await releaseFunds(transaction.id);
    } catch (err: any) {
      onError?.(err);
    }
  };

  const handleInitiateDispute = async () => {
    if (!transaction) return;
    try {
      await initiateDispute(transaction.id, formData.disputeReason);
    } catch (err: any) {
      onError?.(err);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error.message}</div>;
  }

  if (transaction) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
        <div className="space-y-2">
          <p>Amount: {transaction.amount} Pi</p>
          <p>Status: {transaction.status}</p>
          <p>Memo: {transaction.memo}</p>
          <p>Release Conditions: {transaction.releaseConditions}</p>
          
          {transaction.status === 'locked' && user?.id === transaction.sellerId && (
            <button
              onClick={handleReleaseFunds}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Release Funds
            </button>
          )}

          {transaction.status === 'locked' && user?.id === transaction.buyerId && (
            <div className="space-y-2">
              <textarea
                name="disputeReason"
                value={formData.disputeReason}
                onChange={handleInputChange}
                placeholder="Reason for dispute"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleInitiateDispute}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Initiate Dispute
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreateTransaction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Amount (Pi)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
          min="0"
          step="0.000001"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Memo</label>
        <input
          type="text"
          name="memo"
          value={formData.memo}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Release Conditions</label>
        <textarea
          name="releaseConditions"
          value={formData.releaseConditions}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        disabled={isLoading}
      >
        Create Escrow Transaction
      </button>
    </form>
  );
}
