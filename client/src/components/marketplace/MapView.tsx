import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import type { Listing } from 'db/schema';
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Define the icon once at the component level
const defaultIcon = new Icon({
  iconUrl: '/node_modules/leaflet/dist/images/marker-icon.png',
  shadowUrl: '/node_modules/leaflet/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapViewProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

interface GeocodedListing extends Listing {
  coordinates?: [number, number];
}

const geocodeLocation = async (location: string) => {
  if (!location) return null;
  
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
  if (!apiKey) {
    console.error('OpenCage API key is missing');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}&limit=1`
    );
    
    const data = await response.json();
    
    if (data.status?.code !== 200) {
      throw new Error(`Geocoding failed: ${data.status?.message}`);
    }

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return [Number(lat), Number(lng)] as [number, number];
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const LocationSearchInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&limit=5`
      );
      const data = await response.json();

      if (data.results) {
        setSuggestions(
          data.results.map((result: any) => ({
            place_name: result.formatted,
            center: [Number(result.geometry.lat), Number(result.geometry.lng)]
          }))
        );
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Location search failed:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search location..."
          className="cyber-panel neon-focus pl-10"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-primary/30 rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-primary/10"
              onClick={() => {
                onChange(suggestion.place_name);
                setShowSuggestions(false);
              }}
            >
              {suggestion.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MapEvents = ({ onLocationSelect }: { onLocationSelect: (location: string) => void }) => {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&limit=1`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          onLocationSelect(data.results[0].formatted);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
    },
  });
  return null;
};

export default function MapView({ listings, onListingClick }: MapViewProps) {
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<L.Map>(null);

  if (!process.env.NEXT_PUBLIC_OPENCAGE_API_KEY) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel flex items-center justify-center">
        <div className="text-destructive">
          Error: OpenCage API key is missing
        </div>
      </div>
    );
  }

  const handleLocationSelect = useCallback(async (location: string) => {
    setSearchQuery(location);
    const coordinates = await geocodeLocation(location);
    if (coordinates) {
      setMapCenter(coordinates);
      setMapZoom(13);
    }
  }, []);

  useEffect(() => {
    const geocodeListings = async () => {
      if (!listings.length) return;
      
      setIsLoading(true);
      console.log('Starting geocoding for', listings.length, 'listings');
      
      try {
        const geocoded = await Promise.all(
          listings.map(async (listing) => {
            if (!listing.location) {
              console.log('Skipping listing without location:', listing.id);
              return { ...listing };
            }
            
            console.log('Geocoding listing:', listing.id, listing.location);
            const coordinates = await geocodeLocation(listing.location);
            
            if (!coordinates) {
              console.warn(`No coordinates found for listing ${listing.id}`);
              return { ...listing };
            }
            
            console.log('Coordinates found:', coordinates);
            return { ...listing, coordinates };
          })
        );

        const validListings = geocoded.filter((listing): listing is GeocodedListing & { coordinates: [number, number] } => 
          !!listing.coordinates
        );
        
        console.log('Valid geocoded listings:', validListings.length);
        setGeocodedListings(geocoded);
        
        if (validListings.length > 0) {
          setMapCenter(validListings[0].coordinates);
          setMapZoom(13);
        }
      } catch (error) {
        console.error('Failed to geocode listings:', error);
      } finally {
        setIsLoading(false);
      }
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
      <LocationSearchInput value={searchQuery} onChange={handleLocationSelect} />

      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel">
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onLocationSelect={handleLocationSelect} />
          {geocodedListings.map((listing) => {
            if (!listing.coordinates) return null;
            
            return (
              <Marker
                key={listing.id}
                position={listing.coordinates}
                icon={defaultIcon}
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
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
