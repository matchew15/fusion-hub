import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Listing } from 'db/schema';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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

export default function MapView({ listings, onListingClick }: MapViewProps) {
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]); // Default to a more central position
  const [mapZoom, setMapZoom] = useState(2);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the map tiles after component mounts
    const container = L.DomUtil.get('map');
    if (container != null) {
      (container as any)._leaflet_id = null;
    }
  }, []);

  useEffect(() => {
    const geocodeListings = async () => {
      setIsLoading(true);
      
      const geocoded = await Promise.all(
        listings.map(async (listing) => {
          if (!listing.location) return { ...listing };
          
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(listing.location)}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
            );
            const data = await response.json();

            if (data.status?.code === 403) {
              console.error('API Key error:', data.status.message);
              return { ...listing };
            }
            
            if (data.results && data.results.length > 0) {
              const { lat, lng } = data.results[0].geometry;
              return {
                ...listing,
                coordinates: [lat, lng] as [number, number],
              };
            }
          } catch (error) {
            console.error('Geocoding error:', error);
          }
          
          return listing;
        })
      );

      setGeocodedListings(geocoded);

      // Calculate map center and zoom based on listings
      const validCoordinates = geocoded
        .filter((listing): listing is GeocodedListing & { coordinates: [number, number] } => 
          !!listing.coordinates
        )
        .map(listing => listing.coordinates);

      if (validCoordinates.length > 0) {
        // Calculate the center
        const center: [number, number] = [
          validCoordinates.reduce((sum, [lat]) => sum + lat, 0) / validCoordinates.length,
          validCoordinates.reduce((sum, [, lng]) => sum + lng, 0) / validCoordinates.length,
        ];
        setMapCenter(center);

        // Calculate appropriate zoom level
        if (validCoordinates.length === 1) {
          setMapZoom(13); // Close zoom for single location
        } else {
          const bounds = L.latLngBounds(validCoordinates);
          const map = L.map(document.createElement('div'));
          map.fitBounds(bounds);
          setMapZoom(map.getZoom() || 2);
          map.remove();
        }
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
  );
}
