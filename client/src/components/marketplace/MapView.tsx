import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, Map } from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "db/schema";
import 'leaflet/dist/leaflet.css';

const MARKER_ICON_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const MARKER_SHADOW_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const getMarkerIcon = (type: string) => {
  return new Icon({
    iconUrl: MARKER_ICON_URL,
    shadowUrl: MARKER_SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: type === 'Request' ? 'request-marker' : type === 'Service' ? 'service-marker' : 'product-marker'
  });
};

interface MapViewProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

interface GeocodedListing extends Listing {
  coordinates?: [number, number];
}

// Export LocationSearchInput component
export const LocationSearchInput = ({ value, onLocationSelect }: { 
  value: string; 
  onLocationSelect: (location: string) => void;
}) => {
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${import.meta.env.VITE_MAPBOX_API_KEY}&limit=5`
      );
      const data = await response.json();

      if (data.features) {
        setSuggestions(
          data.features.map((feature: any) => ({
            place_name: feature.place_name,
            center: [feature.center[1], feature.center[0]]
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

  return (
    <div className="relative">
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search location..."
          className="pl-10 cyber-panel neon-focus"
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => {
              setShowSuggestions(false);
              onLocationSelect(query);
            }, 200);
          }}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-primary/30 rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-primary/10"
              onMouseDown={(e) => {
                e.preventDefault();
                onLocationSelect(suggestion.place_name);
                setQuery(suggestion.place_name);
                setShowSuggestions(false);
                inputRef.current?.blur();
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

const MapView = ({ listings, onListingClick }: MapViewProps) => {
  const [map, setMap] = useState<Map | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>([]);
  const [mapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    if (map) {
      mapRef.current = map;
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [map, isInitialLoad]);

  const geocodeLocation = async (location: string) => {
    if (!location) return null;

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${import.meta.env.VITE_MAPBOX_API_KEY}&limit=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lat, lng] as [number, number];
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  useEffect(() => {
    const geocodeListings = async () => {
      if (!listings.length || !mapRef.current) {
        setIsLoading(false);
        return;
      }

      if (!import.meta.env.VITE_MAPBOX_API_KEY) {
        setError('Map Service Configuration Error');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const geocodingPromises = listings.map(async (listing) => {
          if (!listing.location) return { ...listing };
          
          try {
            const coordinates = await geocodeLocation(listing.location);
            return { ...listing, coordinates };
          } catch (err) {
            console.error(`Failed to geocode listing ${listing.id}:`, err);
            return { ...listing };
          }
        });

        const geocoded = await Promise.allSettled(geocodingPromises);
        const validListings = geocoded
          .filter((result): result is PromiseFulfilledResult<GeocodedListing> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        setGeocodedListings(validListings);

        if (isInitialLoad) {
          const validListing = validListings.find(listing => listing.coordinates);
          if (validListing?.coordinates && mapRef.current) {
            mapRef.current.setView(validListing.coordinates, 13, { animate: false });
          }
        }
      } catch (error) {
        console.error('Failed to process listings:', error);
        setError('Failed to load location data');
      } finally {
        setIsLoading(false);
      }
    };

    geocodeListings();
  }, [listings, isInitialLoad]);

  if (isLoading) {
    return (
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading map...</p>
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
      <LocationSearchInput
        value={selectedLocation}
        onLocationSelect={(location) => {
          setSelectedLocation(location);
          if (mapRef.current) {
            requestAnimationFrame(() => {
              const coordinates = geocodedListings.find(listing => listing.location === location)?.coordinates;
              if (coordinates) {
                mapRef.current?.setView(coordinates, 13, { animate: false });
              }
            });
          }
        }}
      />
      
      <div className="h-[600px] w-full rounded-lg overflow-hidden cyber-panel">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={false}
          className="h-full w-full"
          whenCreated={(mapInstance) => {
            console.log('Map initialized');
            setMap(mapInstance);
          }}
        >
          <TileLayer
            attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_API_KEY}`}
            tileSize={512}
            zoomOffset={-1}
          />
          {geocodedListings.map((listing) => {
            if (!listing.coordinates) return null;
            return (
              <Marker
                key={listing.id}
                position={listing.coordinates}
                icon={getMarkerIcon(listing.type)}
                eventHandlers={{
                  click: () => onListingClick?.(listing)
                }}
              >
                <Popup>
                  <div className="space-y-2 p-2">
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
};

export default MapView;