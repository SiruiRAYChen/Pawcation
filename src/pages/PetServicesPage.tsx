import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PetService {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  rating?: number;
}

export const PetServicesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<PetService[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchPetServices = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a city name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Google Places API (New) - Text Search
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      // First, geocode the city to get coordinates
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

      const location = geocodeData.results[0].geometry.location;
      
      // Use the new Places API (Text Search) for pet services
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
            textQuery: `pet grooming boarding supplies in ${searchQuery}`,
            locationBias: {
              circle: {
                center: {
                  latitude: location.lat,
                  longitude: location.lng
                },
                radius: 50000.0
              }
            },
            maxResultCount: 10
          })
        }
      );

      const placesData = await placesResponse.json();
      
      if (placesData.places && placesData.places.length > 0) {
        const serviceResults = placesData.places.map((place: any) => {
          // Get photo URL if available
          const photoUrl = place.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`
            : undefined;
          
          return {
            id: place.id,
            name: place.displayName?.text || "Unknown Service",
            address: place.formattedAddress,
            photoUrl,
            rating: place.rating
          };
        });
        setServices(serviceResults);
      } else {
        toast({
          title: "No services found",
          description: "Try searching in a different city",
        });
        setServices([]);
      }
    } catch (error) {
      console.error("Error searching pet services:", error);
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
      searchPetServices();
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
          <h1 className="text-xl font-bold">Pet Services</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter city name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button
            onClick={searchPetServices}
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3">
        {services.length > 0 ? (
          services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-muted/50 rounded-2xl p-4 border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {service.photoUrl ? (
                    <img
                      src={service.photoUrl}
                      alt={service.name}
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
                      {service.name}
                    </h3>
                    {service.rating && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {service.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-primary">★</span>
                      </div>
                    )}
                  </div>
                  {service.address && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.address}
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
                ? "Searching for pet services..."
                : "Search for grooming, boarding, and pet supply stores in your city"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
