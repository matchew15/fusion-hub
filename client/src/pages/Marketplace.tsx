import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/marketplace/ProductCard";
import ListingForm from "@/components/marketplace/ListingForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Listing } from "db/schema";
import { useUser } from "@/hooks/use-user";

export default function Marketplace() {
  const { user } = useUser();
  const { data: listings, mutate } = useSWR<Listing[]>("/api/listings");
  const [search, setSearch] = useState("");

  const filteredListings = listings?.filter(
    (listing) =>
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold glow-text">Marketplace</h1>
        {user && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="neon-border">Create Listing</Button>
            </DialogTrigger>
            <DialogContent className="fixed inset-y-8 left-[50%] translate-x-[-50%] w-[95vw] max-w-2xl max-h-[calc(100vh-4rem)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 cyber-panel p-0">
              <ListingForm onSuccess={() => mutate()} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="w-full max-w-sm">
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="cyber-panel neon-focus"
        />
      </div>

      {listings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings?.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">Loading...</div>
      )}
    </div>
  );
}
