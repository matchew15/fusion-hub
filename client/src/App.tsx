import { Switch, Route, Navigate } from "wouter";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Marketplace from "@/pages/Marketplace";
import Profile from "@/pages/Profile";
import Wallet from "@/pages/Wallet";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

function ProtectedProfile() {
  const { user, authData } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!authData || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return <Profile />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/chat" component={Chat} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/profile" component={ProtectedProfile} />
          <Route path="/wallet" component={Wallet} />
        </Switch>
      </main>
      <Toaster />
    </ErrorBoundary>
  );
}
