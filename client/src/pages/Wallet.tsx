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

  // Initialize Pi SDK on component mount with improved error handling
  useEffect(() => {
    let mounted = true;
    const initializePiSDK = async () => {
      if (!user || !mounted) return;

      try {
        await piHelper.init();
        console.info("Pi SDK initialized in environment:", process.env.NODE_ENV);
      } catch (error: any) {
        console.error("Pi SDK initialization error:", {
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        if (mounted) {
          toast({
            variant: "destructive",
            title: "SDK Error",
            description: error.message || "Failed to initialize Pi SDK. Please try again."
          });
        }
      }
    };

    initializePiSDK();

    return () => {
      mounted = false;
      setBalance(null);
      setIsConnecting(false);
    };
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
        <div className="flex items-center space-x-2 text-destructive transition-all duration-200">
          <AlertCircle className="h-4 w-4 animate-in fade-in-50" />
          <span>{error.message}</span>
        </div>
      );
    }

    if (balance !== null) {
      return (
        <p className="text-4xl font-bold text-primary glow-text animate-in fade-in-50 slide-in-from-bottom-5">
          {balance} π
        </p>
      );
    }

    return (
      <Button
        onClick={handleConnectWallet}
        className="neon-focus transition-all duration-200 animate-in fade-in-50"
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
      <Card className="cyber-panel p-6 text-center animate-in fade-in-50 slide-in-from-bottom-5">
        <p className="text-lg mb-4 glow-text">
          Please open this application in Pi Browser to access wallet features
        </p>
        <a
          href="https://minepi.com/pi-browser"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline neon-focus transition-colors"
        >
          Download Pi Browser
        </a>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="cyber-panel p-6 text-center animate-in fade-in-50 slide-in-from-bottom-5">
        <p className="glow-text">Please login to access your wallet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold glow-text animate-in fade-in-50">Pi Wallet</h1>

      <Card className="cyber-panel p-6 animate-in fade-in-50 slide-in-from-bottom-5">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold glow-text">Balance</h2>
          {renderWalletStatus()}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold glow-text animate-in fade-in-50">Transaction History</h2>
        {!transactions ? (
          <Card className="cyber-panel p-4 text-center text-muted-foreground animate-pulse">
            Loading transactions...
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="cyber-panel p-4 text-center text-muted-foreground animate-in fade-in-50">
            No transactions yet
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <Card 
                key={tx.id} 
                className="cyber-panel p-4 animate-in fade-in-50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium glow-text">
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-primary glow-text">{tx.amount} π</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
