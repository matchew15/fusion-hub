import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/marketplace/ProductCard";
import ListingForm from "@/components/marketplace/ListingForm";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Listing } from "db/schema";
import { useUser } from "@/hooks/use-user";
import { useMediaQuery } from "../hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function Marketplace() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [location, setLocation] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Construct the query string for filtering
  const queryString = new URLSearchParams();
  if (search) queryString.append("search", search);
  if (selectedType) queryString.append("type", selectedType);
  if (location) queryString.append("location", location);
  if (selectedHashtags.length > 0) {
    queryString.append("hashtags", selectedHashtags.join(","));
  }

  const { data: listings, mutate } = useSWR<Listing[]>(
    `/api/listings?${queryString.toString()}`
  );

  const handleHashtagSelect = (hashtag: string) => {
    if (!selectedHashtags.includes(hashtag)) {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };

  const removeHashtag = (hashtag: string) => {
    setSelectedHashtags(selectedHashtags.filter((tag) => tag !== hashtag));
  };

  // Get unique hashtags from all listings
  const allHashtags = Array.from(
    new Set(listings?.flatMap((listing) => listing.hashtags || []) || [])
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold glow-text">Marketplace</h1>
        {user && (
          <>
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="neon-focus">Create Listing</Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="p-0 h-[100dvh] w-full">
                  <ListingForm onSuccess={() => mutate()} />
                </SheetContent>
              </Sheet>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="neon-focus">Create Listing</Button>
                </DialogTrigger>
                <DialogContent className="p-0 w-full max-w-2xl">
                  <ListingForm onSuccess={() => mutate()} />
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="cyber-panel neon-focus"
        />

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="cyber-panel neon-focus">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Service">Service</SelectItem>
            <SelectItem value="Request">Request</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="cyber-panel neon-focus"
        />

        <Select
          value={selectedHashtags[selectedHashtags.length - 1] || ""}
          onValueChange={handleHashtagSelect}
        >
          <SelectTrigger className="cyber-panel neon-focus">
            <SelectValue placeholder="Filter by hashtags" />
          </SelectTrigger>
          <SelectContent>
            {allHashtags.map((hashtag) => (
              <SelectItem key={hashtag} value={hashtag}>
                {hashtag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedHashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedHashtags.map((hashtag) => (
            <Badge
              key={hashtag}
              variant="secondary"
              className="cyber-panel flex items-center gap-1"
            >
              {hashtag}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => removeHashtag(hashtag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {listings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ProductCard 
              key={listing.id} 
              listing={listing} 
              onDelete={() => mutate()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">Loading...</div>
      )}
    </div>
  );
}
