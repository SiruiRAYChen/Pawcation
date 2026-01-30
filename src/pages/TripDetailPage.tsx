import { ItineraryTimeline } from "@/components/plan/ItineraryTimeline";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export const TripDetailPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.getPlan(parseInt(tripId!)),
    enabled: !!tripId,
  });

  // Fetch trip photos
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["tripPhotos", tripId],
    queryFn: () => api.getTripPhotos(parseInt(tripId!)),
    enabled: !!tripId,
  });

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: (photoData: { local_path: string; city_name?: string }) =>
      api.addMemoryPhoto({
        trip_id: parseInt(tripId!),
        user_id: user!.user_id,
        local_path: photoData.local_path,
        city_name: photoData.city_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tripPhotos", tripId] });
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
      queryClient.invalidateQueries({ queryKey: ["tripPhotos", tripId] });
      queryClient.invalidateQueries({ queryKey: ["pastTrips"] });
      queryClient.invalidateQueries({ queryKey: ["visitedCities"] });
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

    // In a real app, you would upload the file to a server
    // For now, we'll use a local object URL
    const localPath = URL.createObjectURL(file);
    
    // Get the first city as default (if it's a road trip)
    let defaultCity: string | undefined;
    if (trip?.trip_type === "Road Trip" && trip.places_passing_by) {
      try {
        const cities = JSON.parse(trip.places_passing_by);
        defaultCity = cities[0];
      } catch {
        const cities = trip.places_passing_by.split(',').map(c => c.trim());
        defaultCity = cities[0];
      }
    } else if (trip?.destination) {
      defaultCity = trip.destination;
    }

    addPhotoMutation.mutate({
      local_path: localPath,
      city_name: defaultCity,
    });
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

  const parseItinerary = (itineraryString?: string) => {
    if (!itineraryString) return null;
    try {
      return JSON.parse(itineraryString);
    } catch {
      return null;
    }
  };

  if (tripLoading) {
    return (
      <div className="min-h-screen pb-24 safe-top">
        <div className="px-4 pt-4">
          <div className="h-8 bg-muted rounded w-1/3 mb-4 animate-pulse" />
          <div className="h-64 bg-muted rounded-lg mb-4 animate-pulse" />
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen pb-24 safe-top flex items-center justify-center px-4">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Trip Not Found</h3>
          <Button onClick={() => navigate("/memories")}>
            Back to Memories
          </Button>
        </div>
      </div>
    );
  }

  const itinerary = parseItinerary(trip.detailed_itinerary);

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/memories")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              {trip.destination || "Trip Details"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Itinerary Section */}
        {itinerary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className="text-xl font-bold text-foreground">Itinerary</h2>
            <ItineraryTimeline 
              days={itinerary.days} 
              total_estimated_cost={itinerary.total_estimated_cost}
              budget={itinerary.budget}
            />
          </motion.div>
        )}

        {/* Photo Gallery Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Photos {photos.length > 0 && `(${photos.length})`}
            </h2>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={addPhotoMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {photosLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-card border border-dashed rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">No photos yet</p>
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
            <div className="grid grid-cols-2 gap-3">
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
                    className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {photo.city_name && (
                    <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full">
                      {photo.city_name}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

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
