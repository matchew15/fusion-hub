import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

export default function Navbar() {
  const { user, login, logout } = useUser();

  return (
    <nav className="border-b border-primary/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <button className="text-2xl font-bold glow-text hover:opacity-80 transition-opacity">
                Pi Market
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
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                className="neon-border"
                onClick={() => login({ username: "demo", password: "demo" })}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
