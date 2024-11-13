import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, Map } from 'leaflet';
import { Loader2, Search, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "db/schema";
import 'leaflet/dist/leaflet.css';

// Get API key from environment
const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
console.log('OpenCage API Key Status:', OPENCAGE_API_KEY ? 'Available' : 'Missing');

// Define icon URLs using CDN
const MARKER_ICON_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const MARKER_SHADOW_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

// Create icon instance
const defaultIcon = new Icon({
  iconUrl: MARKER_ICON_URL,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

interface GeocodedListing extends Listing {
  coordinates?: [number, number];
}

export default function MapView({ listings, onListingClick }: MapViewProps) {
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<Map | null>(null);

  const geocodeLocation = async (location: string) => {
    const apiKey = OPENCAGE_API_KEY;
    if (!location || !apiKey) {
      console.log('Geocoding skipped:', !location ? 'No location provided' : 'No API key available');
      return null;
    }

    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
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

  useEffect(() => {
    const geocodeListings = async () => {
      if (!listings.length) {
        setIsLoading(false);
        return;
      }

      const apiKey = OPENCAGE_API_KEY;
      if (!apiKey) {
        console.error('OpenCage API key not found in environment');
        setError('Map Service Configuration Error');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const geocoded = await Promise.all(
          listings.map(async (listing) => {
            if (!listing.location) return { ...listing };
            
            const coordinates = await geocodeLocation(listing.location);
            return coordinates ? { ...listing, coordinates } : { ...listing };
          })
        );

        const validListings = geocoded.filter((listing): listing is GeocodedListing & { coordinates: [number, number] } => 
          'coordinates' in listing && !!listing.coordinates
        );
        
        setGeocodedListings(geocoded);
        
        if (validListings.length > 0) {
          setMapCenter(validListings[0].coordinates);
          setMapZoom(13);
        }
      } catch (error) {
        console.error('Failed to geocode listings:', error);
        setError('Failed to load location data');
      } finally {
        setIsLoading(false);
      }
    };

    geocodeListings();
  }, [listings]);

  const LocationSearchInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (query: string) => {
      const apiKey = OPENCAGE_API_KEY;
      if (!query || !apiKey) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`
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
      } finally {
        setIsSearching(false);
      }
    };

    useEffect(() => {
      const timer = setTimeout(() => {
        if (value) handleSearch(value);
      }, 300);

      return () => clearTimeout(timer);
    }, [value]);

    return (
      <div className="relative">
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          )}
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
                <MapPin className="inline-block w-4 h-4 mr-2 text-muted-foreground" />
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
        const apiKey = OPENCAGE_API_KEY;
        if (!apiKey) return;
        
        const { lat, lng } = e.latlng;
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&limit=1`
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

  const handleLocationSelect = useCallback(async (location: string) => {
    setSearchQuery(location);
    const coordinates = await geocodeLocation(location);
    if (coordinates && mapRef.current) {
      setMapCenter(coordinates);
      setMapZoom(13);
      mapRef.current.setView(coordinates, 13);
    }
  }, []);

  if (!OPENCAGE_API_KEY) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel flex items-center justify-center">
        <div className="text-destructive space-y-2 text-center p-4">
          <p className="font-bold">Map Service Configuration Error</p>
          <p className="text-sm text-muted-foreground">
            Unable to initialize map service. Please check configuration.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel flex items-center justify-center">
        <div className="text-destructive space-y-2 text-center p-4">
          <p className="font-bold">Map Service Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LocationSearchInput value={searchQuery} onChange={handleLocationSelect} />

      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          whenReady={(event) => {
            mapRef.current = event.target;
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
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {listing.location}
                    </p>
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
