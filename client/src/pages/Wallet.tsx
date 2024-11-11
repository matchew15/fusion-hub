import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { piHelper } from "@/lib/pi-helper";
import useSWR from "swr";
import type { Transaction } from "db/schema";

export default function Wallet() {
  const { user } = useUser();
  const [balance, setBalance] = useState<number | null>(null);
  const { data: transactions } = useSWR<Transaction[]>("/api/transactions");

  useEffect(() => {
    if (user) {
      piHelper.init().catch(console.error);
    }
  }, [user]);

  const handleConnectWallet = async () => {
    try {
      await piHelper.authenticate();
      // In a real app, you'd fetch the actual balance here
      setBalance(100);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold glow-text">Pi Wallet</h1>

      <Card className="cyber-panel p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Balance</h2>
          {balance !== null ? (
            <p className="text-4xl font-bold text-primary">{balance} π</p>
          ) : (
            <Button onClick={handleConnectWallet} className="neon-border">
              Connect Pi Wallet
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
        {transactions?.map((tx) => (
          <Card key={tx.id} className="cyber-panel p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xl font-bold text-primary">{tx.amount} π</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
