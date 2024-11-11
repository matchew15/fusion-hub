import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { piHelper } from "@/lib/pi-helper";
import useSWR from "swr";
import type { Transaction } from "db/schema";

export default function Wallet() {
  const { user, isAuthenticating, retryCount, error } = useUser();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { data: transactions } = useSWR<Transaction[]>("/api/transactions");

  // Initialize Pi SDK on component mount
  useEffect(() => {
    const initializePiSDK = async () => {
      if (!user) return;

      try {
        await piHelper.init();
        console.info("Pi SDK initialized successfully");
      } catch (error: any) {
        console.warn("Pi SDK initialization failed:", error);
        toast({
          variant: "destructive",
          title: "Initialization Failed",
          description: "Failed to initialize Pi SDK. Please try again.",
        });
      }
    };

    initializePiSDK();
  }, [user, toast]);

  const handleConnectWallet = useCallback(async () => {
    if (isConnecting || isAuthenticating) return;
    
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
      const errorMessage = error.code 
        ? `Error (${error.code}): ${error.message}`
        : error.message || "Failed to connect wallet. Please try again.";
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });

      // Log detailed error information
      console.error("Wallet connection error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
        retryCount
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isAuthenticating, toast, retryCount]);

  const renderWalletStatus = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error.message}</span>
        </div>
      );
    }

    if (balance !== null) {
      return <p className="text-4xl font-bold text-primary glow-text">{balance} π</p>;
    }

    return (
      <Button
        onClick={handleConnectWallet}
        className="neon-focus"
        disabled={isConnecting || isAuthenticating}
      >
        {isConnecting || isAuthenticating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {retryCount > 0 ? `Retrying (${retryCount})...` : "Connecting..."}
          </>
        ) : (
          "Connect Pi Wallet"
        )}
      </Button>
    );
  };

  if (!piHelper.isPiBrowser()) {
    return (
      <Card className="cyber-panel p-6 text-center">
        <p className="text-lg mb-4 glow-text">
          Please open this application in Pi Browser to access wallet features
        </p>
        <a
          href="https://minepi.com/pi-browser"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline neon-focus"
        >
          Download Pi Browser
        </a>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="cyber-panel p-6 text-center">
        <p className="glow-text">Please login to access your wallet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold glow-text">Pi Wallet</h1>

      <Card className="cyber-panel p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold glow-text">Balance</h2>
          {renderWalletStatus()}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold glow-text">Transaction History</h2>
        {transactions?.length === 0 && (
          <Card className="cyber-panel p-4 text-center text-muted-foreground">
            No transactions yet
          </Card>
        )}
        {transactions?.map((tx) => (
          <Card key={tx.id} className="cyber-panel p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium glow-text">
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xl font-bold text-primary glow-text">{tx.amount} π</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
