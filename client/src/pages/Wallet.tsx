import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { piHelper } from "@/lib/pi-helper";
import useSWR from "swr";
import type { Transaction } from "db/schema";

export default function Wallet() {
  const { user } = useUser();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { data: transactions } = useSWR<Transaction[]>("/api/transactions");

  useEffect(() => {
    if (user) {
      // Initialize Pi SDK silently without showing errors
      piHelper.init().catch(() => {});
    }
  }, [user]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await piHelper.authenticate();
      // In a real app, you'd fetch the actual balance here
      setBalance(100);
      toast({
        title: "Success",
        description: "Wallet connected successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to connect wallet. Please try again.",
      });
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!piHelper.isPiBrowser()) {
    return (
      <Card className="cyber-panel p-6 text-center">
        <p className="text-lg mb-4">
          Please open this application in Pi Browser to access wallet features
        </p>
        <a
          href="https://minepi.com/pi-browser"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Download Pi Browser
        </a>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="cyber-panel p-6 text-center">
        <p>Please login to access your wallet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold glow-text">Pi Wallet</h1>

      <Card className="cyber-panel p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Balance</h2>
          {balance !== null ? (
            <p className="text-4xl font-bold text-primary">{balance} π</p>
          ) : (
            <Button
              onClick={handleConnectWallet}
              className="neon-border"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Pi Wallet"
              )}
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
        {transactions?.length === 0 && (
          <Card className="cyber-panel p-4 text-center text-muted-foreground">
            No transactions yet
          </Card>
        )}
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
