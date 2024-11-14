import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import i18n from "./lib/i18n";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import Wallet from "./pages/Wallet";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Navbar from "./components/layout/Navbar";

// Wait for translations to be loaded
i18n.loadNamespaces(['common', 'translation']).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <SWRConfig value={{ fetcher }}>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/marketplace" component={Marketplace} />
                <Route path="/wallet" component={Wallet} />
                <Route path="/chat" component={Chat} />
                <Route path="/profile" component={Profile} />
                <Route>404 Page Not Found</Route>
              </Switch>
            </main>
            <Toaster />
          </div>
        </SWRConfig>
      </ErrorBoundary>
    </StrictMode>
  );
});
