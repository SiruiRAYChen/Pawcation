import { ArrowLeft, Search, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { motion } from "framer-motion";

interface Hospital {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  rating?: number;
  place_id?: string;
}

export const HospitalPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCurrentLocation, isGettingLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved search data on component mount
  useEffect(() => {
    const savedSearchData = sessionStorage.getItem('hospitalSearchData');
    if (savedSearchData) {
      try {
        const { query, results } = JSON.parse(savedSearchData);
        setSearchQuery(query || "");
        setHospitals(results || []);
      } catch (error) {
        console.error('Error loading saved search data:', error);
      }
    }

    // Cleanup function to clear cache when leaving the page
    return () => {
      sessionStorage.removeItem('hospitalSearchData');
    };
  }, []);

  // Save search data whenever it changes (but only temporarily)
  useEffect(() => {
    if (searchQuery || hospitals.length > 0) {
      const searchData = {
        query: searchQuery,
        results: hospitals
      };
      sessionStorage.setItem('hospitalSearchData', JSON.stringify(searchData));
    }
  }, [searchQuery, hospitals]);

  const searchHospitals = async (location?: { latitude: number; longitude: number }) => {
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
      
      // Use the new Places API (Text Search) for veterinary hospitals
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
            textQuery: "animal hospital veterinary clinic",
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
        const hospitalResults = placesData.places.map((place: any) => {
          // Get photo URL if available
          const photoUrl = place.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`
            : undefined;
          
          return {
            id: place.id,
            place_id: place.id, // Add place_id for navigation
            name: place.displayName?.text || "Unknown Hospital",
            address: place.formattedAddress,
            photoUrl,
            rating: place.rating
          };
        });
        setHospitals(hospitalResults);
      } else {
        toast({
          title: "No hospitals found",
          description: "Try searching in a different city",
        });
        setHospitals([]);
      }
    } catch (error) {
      console.error("Error searching hospitals:", error);
      toast({
        title: "Search failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalClick = (hospital: Hospital) => {
    navigate(`/hospital/${hospital.place_id}`, {
      state: {
        place_id: hospital.place_id,
        hospitalData: {
          name: hospital.name,
          address: hospital.address,
          photos: hospital.photoUrl ? [hospital.photoUrl] : [],
          rating: hospital.rating,
        }
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchHospitals();
    }
  };

  const handleLocationSearch = async () => {
    try {
      const location = await getCurrentLocation();
      setSearchQuery("📍 Your current location");
      // Search directly using coordinates
      searchHospitals({ latitude: location.latitude, longitude: location.longitude });
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
          <h1 className="text-xl font-bold">Pet Hospitals</h1>
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
              id="hospital-search"
              name="hospitalSearch"
              type="text"
              placeholder={isGettingLocation ? "Getting location..." : "Enter city name or use location"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12"
            />
          </div>
          <Button
            onClick={() => searchHospitals()}
            disabled={isLoading || isGettingLocation}
            className="px-6"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3">
        {hospitals.length > 0 ? (
          hospitals.map((hospital, index) => (
            <motion.button
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleHospitalClick(hospital)}
              className="w-full bg-muted/50 rounded-2xl p-4 border border-border hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {hospital.photoUrl ? (
                    <img
                      src={hospital.photoUrl}
                      alt={hospital.name}
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
                    {hospital.name}
                  </h3>
                  {hospital.address && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-left">
                      {hospital.address}
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
                ? "Searching for hospitals..."
                : "Search for pet hospitals in your destination city"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
