import { Switch, Route, Navigate } from "wouter";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Marketplace from "@/pages/Marketplace";
import Profile from "@/pages/Profile";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

function ProtectedProfile() {
  const { user, authData } = useUser();
  
  if (!authData) {
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
        </Switch>
      </main>
      <Toaster />
    </ErrorBoundary>
  );
}
