import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { api, VisitedCity } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface CityPin {
  city: VisitedCity;
  lat: number;
  lng: number;
}

export const MapsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedCity, setSelectedCity] = useState<VisitedCity | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [cityPins, setCityPins] = useState<CityPin[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

  // Fetch visited cities
  const { data: visitedCities = [], isLoading } = useQuery({
    queryKey: ["visitedCities", user?.user_id],
    queryFn: () => api.getVisitedCities(user!.user_id),
    enabled: !!user,
  });

  // Fetch photos for selected city and trip
  const { data: photos = [] } = useQuery({
    queryKey: ["cityPhotos", selectedTripId, selectedCity?.city_name],
    queryFn: () => api.getTripPhotos(selectedTripId!, selectedCity?.city_name),
    enabled: !!selectedTripId && !!selectedCity,
  });

  // Fetch user's pets
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", user?.user_id],
    queryFn: () => api.getUserPets(user!.user_id),
    enabled: !!user,
  });

  // Fetch all past trips for pet info
  const { data: pastTrips = [] } = useQuery({
    queryKey: ["pastTrips", user?.user_id],
    queryFn: () => api.getPastTrips(user!.user_id),
    enabled: !!user,
  });

  // Geocode cities to get coordinates
  useEffect(() => {
    const geocodeCities = async () => {
      if (visitedCities.length === 0) {
        setCityPins([]);
        return;
      }

      setIsGeocoding(true);
      const pins: CityPin[] = [];
      
      for (const city of visitedCities) {
        try {
          // Try geocoding with original city name first
          let response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city.city_name)}&key=${GOOGLE_MAPS_API_KEY}`
          );
          let data = await response.json();
          
          // If no results and city name doesn't include USA/US, try adding ", USA"
          if ((!data.results || data.results.length === 0) && 
              !city.city_name.toLowerCase().includes('usa') && 
              !city.city_name.toLowerCase().includes('united states')) {
            console.log(`Retrying ${city.city_name} with USA suffix`);
            response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city.city_name + ', USA')}&key=${GOOGLE_MAPS_API_KEY}`
            );
            data = await response.json();
          }
          
          if (data.results && data.results[0]) {
            const { lat, lng } = data.results[0].geometry.location;
            console.log(`Geocoded ${city.city_name} to:`, { lat, lng });
            pins.push({ city, lat, lng });
          } else {
            console.warn(`No geocoding results for ${city.city_name}. API response:`, data);
          }
        } catch (error) {
          console.error(`Failed to geocode ${city.city_name}`, error);
        }
      }
      
      console.log(`Successfully geocoded ${pins.length} out of ${visitedCities.length} cities`);
      setCityPins(pins);
      setIsGeocoding(false);
    };

    geocodeCities();
  }, [visitedCities.length]);

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: (photoData: { local_path: string }) =>
      api.addMemoryPhoto({
        trip_id: selectedTripId!,
        user_id: user!.user_id,
        local_path: photoData.local_path,
        city_name: selectedCity?.city_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["visitedCities"] });
      queryClient.invalidateQueries({ queryKey: ["pastTrips"] });
      toast.success("Photo added successfully");
    },
    onError: () => {
      toast.error("Failed to add photo");
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => api.deleteMemoryPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["visitedCities"] });
      queryClient.invalidateQueries({ queryKey: ["pastTrips"] });
      toast.success("Photo deleted successfully");
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete photo");
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPath = URL.createObjectURL(file);
    addPhotoMutation.mutate({ local_path: localPath });
  };

  const handleDeletePhoto = (photoId: number) => {
    setPhotoToDelete(photoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (photoToDelete) {
      deletePhotoMutation.mutate(photoToDelete);
    }
  };

  const handlePinClick = (city: VisitedCity) => {
    setSelectedCity(city);
    // Default to first trip
    setSelectedTripId(city.trip_ids[0]);
  };

  const getTripsForCity = (city: VisitedCity) => {
    return pastTrips.filter(trip => trip.plan_id && city.trip_ids.includes(trip.plan_id));
  };

  const getPetsForTrip = (tripId: number) => {
    const trip = pastTrips.find(t => t.plan_id === tripId);
    if (!trip || !trip.pet_ids) return [];
    
    const petIds = trip.pet_ids.split(',').map(id => parseInt(id.trim()));
    return pets.filter(pet => pet.pet_id && petIds.includes(pet.pet_id));
  };

  // Generate static map URL with pins
  const getStaticMapUrl = () => {
    if (cityPins.length === 0) return "";

    let markers = cityPins.map((pin) => {
      // Convert hex color to 0xRRGGBB format for Google Maps
      const color = pin.city.trip_color.replace('#', '0x');
      return `markers=color:${color}|${pin.lat},${pin.lng}`;
    }).join('&');

    return `https://maps.googleapis.com/maps/api/staticmap?size=800x600&scale=2&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  if (isLoading || isGeocoding) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isLoading ? "Loading trips..." : "Preparing map..."}
          </p>
        </div>
      </div>
    );
  }

  if (visitedCities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Places Visited Yet
          </h3>
          <p className="text-muted-foreground">
            Complete a trip to see your visited locations on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Map Display */}
      <div className="relative h-full w-full">
        {cityPins.length > 0 ? (
          <>
            <img
              src={getStaticMapUrl()}
              onError={(e) => {
                console.error("Failed to load map image");
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23f0f0f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23999' font-size='20'%3EMap unavailable%3C/text%3E%3C/svg%3E";
              }}
              alt="Travel Map"
              className="w-full h-full object-cover"
            />
            
            {/* Interactive pins overlay */}
            {cityPins.map((pin, idx) => {
              // Calculate pin position on the image
              // This is a simplified version - in production you'd need proper coordinate projection
              const xPercent = ((pin.lng + 180) / 360) * 100;
              const yPercent = ((90 - pin.lat) / 180) * 100;
              
              return (
                <button
                  key={idx}
                  onClick={() => handlePinClick(pin.city)}
                  className="absolute transform -translate-x-1/2 -translate-y-full animate-bounce"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full border-4 border-white shadow-lg"
                    style={{ backgroundColor: pin.city.trip_color }}
                  />
                </button>
              );
            })}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* City Detail Sheet */}
      <Sheet open={!!selectedCity} onOpenChange={(open) => !open && setSelectedCity(null)}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          {selectedCity && (
            <div className="h-full flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>{selectedCity.city_name}</SheetTitle>
                <SheetDescription>
                  View and manage photos from your trip to {selectedCity.city_name}
                </SheetDescription>
              </SheetHeader>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2" aria-hidden="true">
                    {selectedCity.city_name}
                  </h2>
                  
                  {/* Trip selector if multiple trips */}
                  {selectedCity.trip_ids.length > 1 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {getTripsForCity(selectedCity).map((trip) => (
                        <button
                          key={trip.plan_id}
                          onClick={() => setSelectedTripId(trip.plan_id!)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTripId === trip.plan_id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {trip.destination}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pet avatars for selected trip */}
                  {selectedTripId && (
                    <div className="flex -space-x-2">
                      {getPetsForTrip(selectedTripId).slice(0, 3).map((pet) => (
                        <Avatar key={pet.pet_id} className="w-8 h-8 border-2 border-background">
                          {pet.avatar_url ? (
                            <AvatarImage src={pet.avatar_url} alt={pet.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {pet.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    Photos {photos.length > 0 && `(${photos.length})`}
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={addPhotoMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {photos.length === 0 ? (
                  <div className="bg-muted/50 border border-dashed rounded-xl p-8 text-center">
                    <p className="text-muted-foreground text-sm mb-3">No photos yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <motion.div
                        key={photo.photo_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square group"
                      >
                        <img
                          src={photo.local_path}
                          alt="Memory"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeletePhoto(photo.photo_id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this photo. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
