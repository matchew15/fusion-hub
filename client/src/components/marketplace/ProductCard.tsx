import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import { piHelper } from "@/lib/pi-helper";
import type { Listing } from "db/schema";
import { useState } from "react";

interface ProductCardProps {
  listing: Listing;
}

export default function ProductCard({ listing }: ProductCardProps) {
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      await piHelper.createPayment({
        amount: Number(listing.price),
        memo: `Purchase: ${listing.title}`,
        metadata: { listingId: listing.id },
      });

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.sellerId,
          amount: listing.price,
        }),
      });
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="cyber-panel overflow-hidden">
      {listing.image && (
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-4">
        <h3 className="text-xl font-bold">{listing.title}</h3>
        <p className="text-muted-foreground">{listing.description}</p>
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold text-primary">{listing.price} π</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={!user || isProcessing || user.id === listing.sellerId}
                className="neon-border"
              >
                {isProcessing
                  ? "Processing..."
                  : user?.id === listing.sellerId
                  ? "Your Listing"
                  : "Purchase"}
              </Button>
            </DialogTrigger>
            <DialogContent className="cyber-panel">
              <DialogHeader>
                <DialogTitle>Confirm Purchase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Are you sure you want to purchase {listing.title} for{" "}
                  {listing.price} π?
                </p>
                <Button
                  onClick={handlePurchase}
                  className="w-full neon-border"
                  disabled={isProcessing}
                >
                  Confirm Purchase
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}
