import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";

export default function Home() {
  const { user } = useUser();

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold glow-text bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
          Welcome to Fusion Hub
        </h1>
        <p className="text-xl text-muted-foreground">
          The future of P2P trading with Pi cryptocurrency
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="cyber-panel p-6 space-y-4">
          <h3 className="text-2xl font-bold text-primary">Trade Securely</h3>
          <p className="text-muted-foreground">
            Buy and sell with confidence using Pi cryptocurrency
          </p>
          <Link href="/marketplace">
            <Button className="w-full neon-border">Explore Market</Button>
          </Link>
        </Card>

        <Card className="cyber-panel p-6 space-y-4">
          <h3 className="text-2xl font-bold text-primary">Real-time Chat</h3>
          <p className="text-muted-foreground">
            Connect directly with buyers and sellers
          </p>
          <Link href="/chat">
            <Button className="w-full neon-border">Start Chatting</Button>
          </Link>
        </Card>

        <Card className="cyber-panel p-6 space-y-4">
          <h3 className="text-2xl font-bold text-primary">Manage Wallet</h3>
          <p className="text-muted-foreground">
            Track your Pi balance and transactions
          </p>
          <Link href="/wallet">
            <Button className="w-full neon-border">View Wallet</Button>
          </Link>
        </Card>
      </div>

      {!user && (
        <Card className="cyber-panel p-8 mt-8 text-center">
          <h2 className="text-3xl font-bold mb-4 glow-text">Get Started</h2>
          <p className="text-muted-foreground mb-6">
            Join our community to start trading with Pi
          </p>
          <Button size="lg" className="neon-border">
            Register Now
          </Button>
        </Card>
      )}
    </div>
  );
}
