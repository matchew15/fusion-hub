import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import Wallet from "./pages/Wallet";
import Chat from "./pages/Chat";
import Navbar from "./components/layout/Navbar";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig value={{ fetcher }}>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/marketplace" component={Marketplace} />
            <Route path="/wallet" component={Wallet} />
            <Route path="/chat" component={Chat} />
            <Route>404 Page Not Found</Route>
          </Switch>
        </main>
        <Toaster />
      </div>
    </SWRConfig>
  </StrictMode>
);
