import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { piHelper } from "@/lib/pi-helper";
import type { Listing } from "db/schema";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface ProductCardProps {
  listing: Listing;
  onDelete?: () => void;
}

export default function ProductCard({ listing, onDelete }: ProductCardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase"
      });
      console.error("Purchase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      toast({
        title: "Success",
        description: "Listing deleted successfully"
      });
      
      onDelete?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete listing"
      });
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = user?.id === listing.sellerId;

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
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold">{listing.title}</h3>
          {isOwner && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="cyber-panel">
                <DialogHeader>
                  <DialogTitle>Delete Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Are you sure you want to delete this listing?</p>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="w-full neon-border"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Listing"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <p className="text-muted-foreground">{listing.description}</p>
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold text-primary">{listing.price} π</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={!user || isProcessing || isOwner}
                className="neon-border"
              >
                {isProcessing
                  ? "Processing..."
                  : isOwner
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
