import { ArrowLeft, Search, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { motion } from "framer-motion";

interface Hotel {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  rating?: number;
}

export const HotelsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCurrentLocation, isGettingLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchHotels = async (location?: { latitude: number; longitude: number }) => {
    if (!searchQuery.trim() && !location) {
      toast({
        title: "Please enter a city name or use location",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      let searchLocation;
      
      if (location) {
        // Use provided coordinates directly
        searchLocation = location;
      } else {
        // Geocode the city to get coordinates
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.status !== "OK" || !geocodeData.results[0]) {
          toast({
            title: "City not found",
            description: "Please try a different city name",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        searchLocation = geocodeData.results[0].geometry.location;
      }
      
      // Use the new Places API (Text Search)
      const placesResponse = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.photos,places.rating"
          },
          body: JSON.stringify({
            textQuery: location ? "pet friendly hotel" : `pet friendly hotels in ${searchQuery}`,
            locationBias: {
              circle: {
                center: {
                  latitude: searchLocation.latitude || searchLocation.lat,
                  longitude: searchLocation.longitude || searchLocation.lng
                },
                radius: 10000.0 // 10km radius for nearby search
              }
            },
            maxResultCount: 10
          })
        }
      );

      const placesData = await placesResponse.json();
      
      if (placesData.places && placesData.places.length > 0) {
        const hotelResults = placesData.places.map((place: any) => {
          // Get photo URL if available
          const photoUrl = place.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`
            : undefined;
          
          return {
            id: place.id,
            name: place.displayName?.text || "Unknown Hotel",
            address: place.formattedAddress,
            photoUrl,
            rating: place.rating
          };
        });
        setHotels(hotelResults);
      } else {
        toast({
          title: "No hotels found",
          description: "Try searching in a different city",
        });
        setHotels([]);
      }
    } catch (error) {
      console.error("Error searching hotels:", error);
      toast({
        title: "Search failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchHotels();
    }
  };

  const handleLocationSearch = async () => {
    try {
      const location = await getCurrentLocation();
      setSearchQuery("📍 Your current location");
      // Search directly using coordinates
      searchHotels({ latitude: location.latitude, longitude: location.longitude });
    } catch (error) {
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Unable to get location",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Pet-Friendly Hotels</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10"
              onClick={handleLocationSearch}
              disabled={isGettingLocation || isLoading}
            >
              <MapPin className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Search className="absolute left-11 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isGettingLocation ? "Getting location..." : "Enter city name or use location"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-20"
            />
          </div>
          <Button
            onClick={searchHotels}
            disabled={isLoading || isGettingLocation}
            className="px-6"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3">
        {hotels.length > 0 ? (
          hotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-muted/50 rounded-2xl p-4 border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {hotel.photoUrl ? (
                    <img
                      src={hotel.photoUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Search className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-foreground line-clamp-1">
                      {hotel.name}
                    </h3>
                    {hotel.rating && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {hotel.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-primary">★</span>
                      </div>
                    )}
                  </div>
                  {hotel.address && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {hotel.address}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isLoading
                ? "Searching for hotels..."
                : "Search for pet-friendly hotels in your destination city"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
