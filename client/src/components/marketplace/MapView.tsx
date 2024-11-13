import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Listing } from 'db/schema';
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

interface GeocodedListing extends Listing {
  coordinates?: [number, number];
}

interface SearchResult {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
}

export default function MapView({ listings, onListingClick }: MapViewProps) {
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]); // Default to a more central position
  const [mapZoom, setMapZoom] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    // Load the map tiles after component mounts
    const container = L.DomUtil.get('map');
    if (container != null) {
      (container as any)._leaflet_id = null;
    }
  }, []);

  const handleLocationSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&limit=5`
      );
      const data = await response.json();
      
      if (data.results) {
        const results = data.results.map((result: any) => ({
          formatted: result.formatted,
          geometry: result.geometry
        }));
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleLocationSelect = (result: SearchResult) => {
    setMapCenter([result.geometry.lat, result.geometry.lng]);
    setMapZoom(13);
    setSearchQuery(result.formatted);
    setShowSearchResults(false);
  };

  useEffect(() => {
    const geocodeListings = async () => {
      console.log('Starting geocoding for', listings.length, 'listings');
      setIsLoading(true);
      
      const geocoded = await Promise.all(
        listings.map(async (listing) => {
          if (!listing.location) return { ...listing };
          
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(listing.location)}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&limit=1`
            );
            
            if (!response.ok) {
              throw new Error(`Geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const { lat, lng } = data.results[0].geometry;
              return {
                ...listing,
                coordinates: [lat, lng] as [number, number],
              };
            }
            
            console.warn(`No coordinates found for location: ${listing.location}`);
            return { ...listing };
          } catch (error) {
            console.error(`Geocoding error for ${listing.location}:`, error);
            return { ...listing };
          }
        })
      );

      const validListings = geocoded.filter((listing): listing is GeocodedListing & { coordinates: [number, number] } => 
        !!listing.coordinates
      );
      setGeocodedListings(geocoded);
      
      if (validListings.length > 0) {
        // Update map center to first valid listing
        setMapCenter(validListings[0].coordinates || [20, 0]);
        setMapZoom(validListings.length === 1 ? 13 : 2);
      }
      
      setIsLoading(false);
    };

    geocodeListings();
  }, [listings]);

  if (isLoading) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleLocationSearch(e.target.value);
          }}
          placeholder="Search for a location..."
          className="cyber-panel neon-focus pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg bg-background border border-primary/30 shadow-lg">
            {searchResults.map((result, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-left hover:bg-primary/10"
                onClick={() => handleLocationSelect(result)}
              >
                {result.formatted}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel">
        <MapContainer
          id="map"
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geocodedListings.map((listing) => (
            listing.coordinates && (
              <Marker
                key={listing.id}
                position={listing.coordinates}
                eventHandlers={{
                  click: () => onListingClick?.(listing),
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    <h3 className="font-bold">{listing.title}</h3>
                    <Badge variant={listing.type === "Request" ? "secondary" : "default"}>
                      {listing.type}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{listing.description}</p>
                    <p className="font-bold text-primary">{listing.price} π</p>
                    <p className="text-sm">{listing.location}</p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
