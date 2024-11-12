import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user, login, logout } = useUser();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    try {
      const result = await login();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: result.message,
      });
    }
  };

  return (
    <nav className="border-b border-primary/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <button className="text-2xl font-bold glow-text hover:opacity-80 transition-opacity">
                Fusion Hub
              </button>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/marketplace">
                <button className="hover:text-primary transition-colors">
                  Marketplace
                </button>
              </Link>
              <Link href="/wallet">
                <button className="hover:text-primary transition-colors">
                  Wallet
                </button>
              </Link>
              <Link href="/chat">
                <button className="hover:text-primary transition-colors">
                  Chat
                </button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.username}
                </span>
                <Button
                  variant="outline"
                  className="neon-border"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                className="neon-border"
                onClick={handleLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Pi"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
