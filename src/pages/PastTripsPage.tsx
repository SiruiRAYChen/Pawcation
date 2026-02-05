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
import { useAuth } from "@/contexts/AuthContext";
import { api, PastTrip, Pet } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const PastTripsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);
  const [swipedTripId, setSwipedTripId] = useState<string | number | null>(null);

  // Fetch past trips
  const { data: pastTrips = [], isLoading } = useQuery({
    queryKey: ["pastTrips", user?.user_id],
    queryFn: () => api.getPastTrips(user!.user_id),
    enabled: !!user,
  });

  // Fetch user's pets
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", user?.user_id],
    queryFn: () => api.getUserPets(user!.user_id),
    enabled: !!user,
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: (tripId: number) => api.deletePastTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastTrips"] });
      toast.success("Trip deleted successfully");
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete trip");
    },
  });

  const handleDeleteClick = (tripId: number) => {
    setTripToDelete(tripId);
    setDeleteDialogOpen(true);
    setSwipedTripId(tripId);
  };

  const handleDeleteConfirm = () => {
    if (tripToDelete) {
      deleteTripMutation.mutate(tripToDelete);
    }
  };

  const getPetsForTrip = (trip: PastTrip): Pet[] => {
    if (!trip.pet_ids) return [];
    const petIds = trip.pet_ids.split(',').map(id => parseInt(id.trim()));
    return pets.filter(pet => pet.pet_id && petIds.includes(pet.pet_id));
  };

  const formatTimeLabel = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return format(start, "MMM yyyy");
    }
    return `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 safe-top">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border animate-pulse">
              <div className="h-32 bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pastTrips.length === 0) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 safe-top flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Past Trips Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Your completed trips will appear here once they're over.
          </p>
          <Button onClick={() => navigate("/plan")}>
            Plan a Trip
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 safe-top">
      <AnimatePresence mode="popLayout">
        {pastTrips.map((trip, index) => {
          const tripPets = getPetsForTrip(trip);
          const timeLabel = formatTimeLabel(trip.start_date, trip.end_date);

          return (
            <motion.div
              key={trip.plan_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="mb-4 relative"
            >
              {/* Delete button background - always in position but hidden */}
              <div className="absolute inset-0 flex items-center justify-end pr-4 bg-destructive rounded-2xl">
                <Trash2 className="w-5 h-5 text-destructive-foreground" />
              </div>

              {/* Swipeable card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -40) {
                    handleDeleteClick(trip.plan_id!);
                  } else {
                    setSwipedTripId(null);
                  }
                }}
                animate={{ x: swipedTripId === trip.plan_id ? -80 : 0 }}
                className="relative bg-card rounded-2xl border overflow-hidden shadow-paw cursor-pointer"
                onClick={() => navigate(`/memories/trip/${trip.plan_id}`)}
              >
                {/* Cover Image */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                  {trip.cover_photo ? (
                    <img
                      src={trip.cover_photo}
                      alt={trip.destination || "Trip"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                </div>

                {/* Trip Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {trip.destination || "Trip"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{timeLabel}</span>
                      </div>
                    </div>

                    {/* Pet Avatars */}
                    {tripPets.length > 0 && (
                      <div className="flex -space-x-2">
                        {tripPets.slice(0, 3).map((pet) => (
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
                        {tripPets.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{tripPets.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Photo count and type */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    {trip.photo_count > 0 && (
                      <span>{trip.photo_count} photo{trip.photo_count !== 1 ? 's' : ''}</span>
                    )}
                    {trip.trip_type && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {trip.trip_type}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSwipedTripId(null);
            setTripToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip and all its photos. This action cannot be undone.
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
