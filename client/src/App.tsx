import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Marketplace from "@/pages/Marketplace";
import Profile from "@/pages/Profile";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/chat" component={Chat} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/profile" component={Profile} />
        </Switch>
      </main>
      <Toaster />
    </>
  );
}
