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
              <a className="text-2xl font-bold glow-text">Pi Market</a>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/marketplace">
                <a className="hover:text-primary transition-colors">Marketplace</a>
              </Link>
              <Link href="/wallet">
                <a className="hover:text-primary transition-colors">Wallet</a>
              </Link>
              <Link href="/chat">
                <a className="hover:text-primary transition-colors">Chat</a>
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
