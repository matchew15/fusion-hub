import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, Tag, MessageSquare } from "lucide-react";

interface ProductCardProps {
  listing: Listing;
  onDelete?: () => void;
}

export default function ProductCard({ listing, onDelete }: ProductCardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleWhatsAppChat = () => {
    if (!listing.whatsappNumber) {
      toast({
        variant: "destructive",
        title: "Contact Error",
        description: "WhatsApp number not available for this listing"
      });
      return;
    }

    // Format the message
    const message = encodeURIComponent(
      `Hi! I'm interested in your listing "${listing.title}" on Fusion Hub for ${listing.price} π`
    );
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${listing.whatsappNumber.replace(/\+/g, '')}?text=${message}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleAction = async () => {
    try {
      setIsProcessing(true);
      const amount = listing.type === "Request" ? listing.price : Number(listing.price);
      await piHelper.createPayment({
        amount,
        memo: `${listing.type}: ${listing.title}`,
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
        title: `${listing.type === "Request" ? "Offer" : "Purchase"} Failed`,
        description: error.message || `Failed to complete ${listing.type === "Request" ? "offer" : "purchase"}`
      });
      console.error("Action failed:", error);
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
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{listing.title}</h3>
            <Badge variant={listing.type === "Request" ? "secondary" : "default"}>
              {listing.type}
            </Badge>
          </div>
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
        
        {listing.hashtags && listing.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.hashtags.map((tag, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="space-y-1">
            {listing.type === "Request" ? (
              <>
                <p className="text-sm text-muted-foreground">Offering</p>
                <p className="text-2xl font-bold text-primary">{listing.price} π</p>
                {listing.buyPrice && (
                  <p className="text-sm text-muted-foreground">
                    Max buy price: {listing.buyPrice} π
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xl font-bold text-primary">{listing.price} π</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isOwner && listing.whatsappNumber && (
              <Button
                variant="outline"
                className="neon-border"
                onClick={handleWhatsAppChat}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            )}

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
                    : listing.type === "Request"
                    ? "Make Offer"
                    : "Purchase"}
                </Button>
              </DialogTrigger>
              <DialogContent className="cyber-panel">
                <DialogHeader>
                  <DialogTitle>
                    {listing.type === "Request" ? "Confirm Offer" : "Confirm Purchase"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    {listing.type === "Request"
                      ? `Are you sure you want to offer ${listing.price} π for ${listing.title}?`
                      : `Are you sure you want to purchase ${listing.title} for ${listing.price} π?`}
                  </p>
                  <Button
                    onClick={handleAction}
                    className="w-full neon-border"
                    disabled={isProcessing}
                  >
                    {listing.type === "Request" ? "Confirm Offer" : "Confirm Purchase"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Card>
  );
}