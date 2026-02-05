import { ArrowLeft, Search, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { motion } from "framer-motion";

interface PetService {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  rating?: number;
  place_id?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  query: string;
}

const serviceCategories: ServiceCategory[] = [
  { id: 'grooming', name: 'Grooming', query: 'pet grooming salon' },
  { id: 'boarding', name: 'Boarding', query: 'pet boarding daycare' },
  { id: 'supplies', name: 'Supplies', query: 'pet store supplies' }
];

export const PetServicesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCurrentLocation, isGettingLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<PetService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('grooming');

  // Load saved search data on component mount
  useEffect(() => {
    const savedSearchData = sessionStorage.getItem('petServiceSearchData');
    if (savedSearchData) {
      try {
        const { query, results, category } = JSON.parse(savedSearchData);
        setSearchQuery(query || "");
        setServices(results || []);
        setSelectedCategory(category || 'grooming');
      } catch (error) {
        console.error('Error loading saved search data:', error);
      }
    }
  }, []);

  // Clear cache when user explicitly navigates back to explore
  const handleBackToExplore = () => {
    sessionStorage.removeItem('petServiceSearchData');
    navigate(-1);
  };

  // Save search data whenever it changes (but only temporarily)
  useEffect(() => {
    if (searchQuery || services.length > 0) {
      const searchData = {
        query: searchQuery,
        results: services,
        category: selectedCategory
      };
      sessionStorage.setItem('petServiceSearchData', JSON.stringify(searchData));
    }
  }, [searchQuery, services, selectedCategory]);

  const searchPetServices = async (location?: { latitude: number; longitude: number }) => {
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
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&region=us&key=${apiKey}`
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
            textQuery: serviceCategories.find(cat => cat.id === selectedCategory)?.query || "pet services",
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
        const serviceResults = placesData.places.map((place: any) => {
          // Get photo URL if available
          const photoUrl = place.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`
            : undefined;
          
          return {
            id: place.id,
            place_id: place.id, // Add place_id for navigation
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

  const handleServiceClick = (service: PetService) => {
    navigate(`/pet-services/${service.place_id}`, {
      state: {
        place_id: service.place_id,
        serviceData: {
          name: service.name,
          address: service.address,
          photos: service.photoUrl ? [service.photoUrl] : [],
          rating: service.rating,
        }
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchPetServices();
    }
  };

  const handleLocationSearch = async () => {
    try {
      const location = await getCurrentLocation();
      setSearchQuery("📍 Your current location");
      // Search directly using coordinates
      searchPetServices({ latitude: location.latitude, longitude: location.longitude });
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
            onClick={handleBackToExplore}
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10"
              onClick={handleLocationSearch}
              disabled={isGettingLocation || isLoading}
            >
              <MapPin className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Input
              id="petservices-search"
              name="petServicesSearch"
              type="text"
              placeholder={isGettingLocation ? "Getting location..." : "Enter city name or use location"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12"
            />
          </div>
          <Button
            onClick={() => searchPetServices()}
            disabled={isLoading || isGettingLocation}
            className="px-6"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Service Category Filter */}
        <div className="mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {serviceCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex-shrink-0 rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3">
        {services.length > 0 ? (
          services.map((service, index) => (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleServiceClick(service)}
              className="w-full bg-muted/50 rounded-2xl p-4 border border-border hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer"
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
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-semibold text-base text-foreground line-clamp-1 text-left">
                    {service.name}
                  </h3>
                  {service.address && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-left">
                      {service.address}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
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
