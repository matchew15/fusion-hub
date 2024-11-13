import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUser } from '@/hooks/use-user';
import { formatDistance } from 'date-fns';

interface Transaction {
  id: number;
  amount: string;
  status: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
  disputeStatus?: string;
  disputeReason?: string;
  seller: {
    id: number;
    username: string;
  };
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions/history');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'locked':
        return 'bg-blue-500';
      case 'released':
        return 'bg-green-500';
      case 'disputed':
        return 'bg-red-500';
      case 'refunded':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      {transactions.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No transactions found
        </Card>
      ) : (
        transactions.map((transaction) => (
          <Card key={transaction.id} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{transaction.memo}</h3>
                <p className="text-sm text-muted-foreground">
                  With {transaction.seller.username}
                </p>
              </div>
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{transaction.amount} π</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(new Date(transaction.createdAt), new Date(), { addSuffix: true })}
                </p>
              </div>
              
              {transaction.disputeStatus && (
                <Badge variant="outline" className="ml-2">
                  Dispute: {transaction.disputeStatus}
                </Badge>
              )}
            </div>

            {transaction.disputeReason && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="font-semibold">Dispute Reason:</p>
                <p>{transaction.disputeReason}</p>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
