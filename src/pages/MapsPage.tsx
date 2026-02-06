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
import { api, ItineraryResponse, MemoryPhoto, PastTrip } from "@/lib/api";
import { uploadMemoryPhoto } from "@/lib/storage";
import { GoogleMap, InfoWindowF, PolylineF, useLoadScript } from "@react-google-maps/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES: ("places" | "marker")[] = ["places", "marker"];
const USE_DIRECTIONS = String(import.meta.env.VITE_GOOGLE_MAPS_USE_DIRECTIONS) === "true";
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

interface RouteStop {
  cityName: string;
  dateLabel?: string;
  timeLabel?: string;
  tripId: string | number;
  tripType?: string;
}

interface MarkerLocation {
  stop: RouteStop;
  position: google.maps.LatLngLiteral;
}

interface RoutePathSegment {
  tripId: string | number;
  path: google.maps.LatLngLiteral[];
  color: string;
}

export const MapsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [sheetStop, setSheetStop] = useState<RouteStop | null>(null);
  const [markerLocations, setMarkerLocations] = useState<MarkerLocation[]>([]);
  const [routePaths, setRoutePaths] = useState<RoutePathSegment[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [tripPhotosByTrip, setTripPhotosByTrip] = useState<Map<string, MemoryPhoto[]>>(new Map());
  const markersRef = useRef<Array<google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>([]);
  const geocodeCacheRef = useRef<Map<string, google.maps.LatLngLiteral>>(new Map());

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Fetch visited cities
  const { data: visitedCities = [], isLoading } = useQuery({
    queryKey: ["visitedCities", user?.user_id],
    queryFn: () => api.getVisitedCities(user!.user_id),
    enabled: !!user,
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

  const { data: cityPhotos = [] } = useQuery({
    queryKey: ["cityPhotos", sheetStop?.tripId, sheetStop?.cityName],
    queryFn: () => api.getTripPhotos(sheetStop!.tripId, sheetStop?.cityName),
    enabled: !!sheetStop,
  });

  useEffect(() => {
    if (pastTrips.length === 0) {
      setTripPhotosByTrip(new Map());
      return;
    }

    let cancelled = false;
    const loadPhotos = async () => {
      const entries = await Promise.all(
        pastTrips.map(async (trip) => {
          if (!trip.plan_id) return null;
          try {
            const photos = await api.getTripPhotos(trip.plan_id);
            return [String(trip.plan_id), photos] as const;
          } catch {
            return [String(trip.plan_id), [] as MemoryPhoto[]] as const;
          }
        })
      );

      if (cancelled) return;
      const map = new Map<string, MemoryPhoto[]>();
      entries.forEach((entry) => {
        if (!entry) return;
        map.set(entry[0], entry[1]);
      });
      setTripPhotosByTrip(map);
    };

    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [pastTrips]);

  const parseItinerary = (itineraryString?: string): ItineraryResponse | null => {
    if (!itineraryString) return null;
    try {
      return JSON.parse(itineraryString) as ItineraryResponse;
    } catch {
      return null;
    }
  };

  const extractCityFromSubtitle = (subtitle?: string) => {
    if (!subtitle) return null;
    const candidate = subtitle.split("•")[0]?.trim();
    if (!candidate) return null;
    if (!candidate.includes(",")) return null;
    if (/route|drive|via|highway|parkway/i.test(candidate)) return null;
    return candidate;
  };

  const isDirectTrip = (tripType?: string) => {
    if (!tripType) return false;
    return tripType.toLowerCase() === "direct trip" || tripType.toLowerCase() === "direct flight";
  };

  const buildStopsForTrip = (trip?: PastTrip): RouteStop[] => {
    if (!trip || !trip.plan_id) return [];
    if (isDirectTrip(trip.trip_type)) {
      if (!trip.destination) return [];
      return [
        {
          cityName: trip.destination,
          dateLabel: trip.start_date || "Planned",
          timeLabel: "",
          tripId: trip.plan_id,
          tripType: trip.trip_type,
        },
      ];
    }
    const itinerary = parseItinerary(trip.detailed_itinerary);
    const tripId = trip.plan_id;
    const stops: RouteStop[] = [];
    const seen = new Set<string>();

    itinerary?.days?.forEach((day) => {
      day.items.forEach((item) => {
        const cityName = extractCityFromSubtitle(item.subtitle);
        if (!cityName) return;
        const key = cityName.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        stops.push({
          cityName,
          dateLabel: day.date,
          timeLabel: item.time,
          tripId,
          tripType: trip.trip_type,
        });
      });
    });

    if (stops.length > 0) return stops;

    const tripIdString = String(tripId);
    return visitedCities
      .filter((city) => city.trip_ids.some((id) => String(id) === tripIdString))
      .map((city) => ({
        cityName: city.city_name,
        dateLabel: "Planned",
        timeLabel: "",
        tripId,
        tripType: trip.trip_type,
      }));
  };

  const allStops = useMemo(
    () => pastTrips.flatMap((trip) => buildStopsForTrip(trip)),
    [pastTrips, visitedCities]
  );

  const stopKey = useMemo(
    () => allStops.map((stop) => `${stop.tripId}:${stop.cityName}`).join("|")
      || String(pastTrips.length),
    [allStops, pastTrips.length]
  );

  const tripColorMap = useMemo(() => {
    const map = new Map<string, string>();
    visitedCities.forEach((city) => {
      city.trip_ids.forEach((tripId) => {
        const key = String(tripId);
        if (!map.has(key)) {
          map.set(key, city.trip_color);
        }
      });
    });
    return map;
  }, [visitedCities]);

  const getTripColor = (tripId: string | number) => {
    const key = String(tripId);
    return (
      tripColorMap.get(key) ||
      ["#2563eb", "#db2777", "#14b8a6", "#f97316", "#7c3aed"][
        Math.abs(key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 5
      ]
    );
  };

  const formatCheckIn = (stop: RouteStop) => {
    const tripPhotos = tripPhotosByTrip.get(String(stop.tripId)) || [];
    const checkInPhoto = tripPhotos
      .filter((photo) => photo.city_name && photo.city_name.toLowerCase() === stop.cityName.toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (checkInPhoto?.created_at) {
      return `Checked in: ${new Date(checkInPhoto.created_at).toLocaleString()}`;
    }
    if (stop.dateLabel || stop.timeLabel) {
      const timeLabel = stop.timeLabel ? stop.timeLabel.charAt(0).toUpperCase() + stop.timeLabel.slice(1) : "";
      return [stop.dateLabel, timeLabel].filter(Boolean).join(" • ");
    }
    return "Planned stop";
  };

  const geocodeAddress = async (address: string): Promise<google.maps.LatLngLiteral | null> => {
    const cached = geocodeCacheRef.current.get(address);
    if (cached) return cached;
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ address });
    if (!result.results[0]) return null;
    const location = result.results[0].geometry.location;
    const coords = { lat: location.lat(), lng: location.lng() };
    geocodeCacheRef.current.set(address, coords);
    return coords;
  };

  useEffect(() => {
    const geocodeStops = async () => {
      if (!isLoaded || allStops.length === 0) {
        setMarkerLocations([]);
        return;
      }

      setIsGeocoding(true);
      const locations: MarkerLocation[] = [];
      for (const stop of allStops) {
        const address = stop.cityName.toLowerCase().includes("united states") || stop.cityName.toLowerCase().includes("usa")
          ? stop.cityName
          : `${stop.cityName}, USA`;
        try {
          const coords = await geocodeAddress(address);
          if (coords) {
            locations.push({ stop, position: coords });
          }
        } catch (error) {
          console.error(`Failed to geocode ${stop.cityName}`, error);
        }
      }

      setMarkerLocations((prev) => {
        if (prev.length === locations.length &&
            prev.every((item, idx) =>
              item.stop.cityName === locations[idx].stop.cityName &&
              String(item.stop.tripId) === String(locations[idx].stop.tripId) &&
              item.position.lat === locations[idx].position.lat &&
              item.position.lng === locations[idx].position.lng
            )) {
          return prev;
        }
        return locations;
      });
      setIsGeocoding(false);
    };

    geocodeStops();
  }, [stopKey, isLoaded]);

  useEffect(() => {
    if (!isLoaded || markerLocations.length < 2) {
      setRoutePaths([]);
      return;
    }

    const grouped = markerLocations.reduce<Record<string, MarkerLocation[]>>((acc, loc) => {
      const key = String(loc.stop.tripId);
      acc[key] = acc[key] ? [...acc[key], loc] : [loc];
      return acc;
    }, {});

    const buildStraightLines = () => {
      const segments: RoutePathSegment[] = [];
      for (const [tripId, locations] of Object.entries(grouped)) {
        if (locations.some((loc) => isDirectTrip(loc.stop.tripType))) {
          continue;
        }
        if (locations.length < 2) continue;
        segments.push({
          tripId,
          color: getTripColor(tripId),
          path: locations.map((loc) => loc.position),
        });
      }
      setRoutePaths(segments);
    };

    if (!USE_DIRECTIONS) {
      buildStraightLines();
      return;
    }

    const loadDirections = async () => {
      const segments: RoutePathSegment[] = [];

      for (const [tripId, locations] of Object.entries(grouped)) {
        if (locations.some((loc) => isDirectTrip(loc.stop.tripType))) {
          continue;
        }
        if (locations.length < 2) continue;
        const color = getTripColor(tripId);

        if (locations.length > 25) {
          segments.push({
            tripId,
            color,
            path: locations.map((loc) => loc.position),
          });
          continue;
        }

        const directionsService = new google.maps.DirectionsService();
        const origin = locations[0].position;
        const destination = locations[locations.length - 1].position;
        const waypoints = locations.slice(1, -1).map((loc) => ({
          location: loc.position,
          stopover: true,
        }));

        await new Promise<void>((resolve) => {
          directionsService.route(
            {
              origin,
              destination,
              waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result?.routes?.[0]) {
                const path = result.routes[0].overview_path.map((point) => ({
                  lat: point.lat(),
                  lng: point.lng(),
                }));
                segments.push({ tripId, color, path });
              } else {
                console.warn("Failed to load route, falling back to straight line", status);
                segments.push({
                  tripId,
                  color,
                  path: locations.map((loc) => loc.position),
                });
              }
              resolve();
            }
          );
        });
      }

      setRoutePaths(segments);
    };

    loadDirections();
  }, [isLoaded, markerLocations]);

  useEffect(() => {
    if (!mapInstance || markerLocations.length === 0) return;
    if (markerLocations.length === 1) {
      mapInstance.setCenter({ lat: 39.8283, lng: -98.5795 });
      mapInstance.setZoom(4);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markerLocations.forEach((location) => bounds.extend(location.position));
    mapInstance.fitBounds(bounds, { top: 80, right: 60, bottom: 200, left: 60 });
  }, [mapInstance, markerLocations]);

  useEffect(() => {
    if (!mapInstance) return;

    markersRef.current.forEach((marker) => {
      if (marker instanceof google.maps.Marker) {
        marker.setMap(null);
      } else {
        marker.map = null;
      }
    });
    markersRef.current = [];

    markerLocations.forEach((location) => {
      if (GOOGLE_MAPS_MAP_ID && google.maps.marker?.AdvancedMarkerElement && google.maps.marker?.PinElement) {
        const pin = new google.maps.marker.PinElement({
          background: getTripColor(location.stop.tripId),
          borderColor: "#ffffff",
          glyphColor: "#111827",
        });
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance,
          position: location.position,
          content: pin.element,
        });
        marker.addListener("gmp-click", () => handlePinClick(location.stop));
        markersRef.current.push(marker);
      } else {
        const marker = new google.maps.Marker({
          map: mapInstance,
          position: location.position,
          icon: {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
            scale: 1.5,
            fillOpacity: 1,
            fillColor: getTripColor(location.stop.tripId),
            strokeColor: "#ffffff",
            strokeWeight: 2,
            anchor: new google.maps.Point(12, 22),
          },
        });
        marker.addListener("click", () => handlePinClick(location.stop));
        markersRef.current.push(marker);
      }
    });
  }, [mapInstance, markerLocations, tripColorMap]);

  const refreshTripPhotos = async (tripId?: string | number | null) => {
    if (!tripId) return;
    try {
      const photos = await api.getTripPhotos(tripId);
      setTripPhotosByTrip((prev) => {
        const next = new Map(prev);
        next.set(String(tripId), photos);
        return next;
      });
    } catch {
      // ignore refresh errors
    }
  };

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: (photoData: { local_path: string }) =>
      api.addMemoryPhoto({
        trip_id: sheetStop?.tripId!,
        user_id: user!.user_id,
        local_path: photoData.local_path,
        city_name: sheetStop?.cityName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["visitedCities"] });
      queryClient.invalidateQueries({ queryKey: ["pastTrips"] });
      void refreshTripPhotos(sheetStop?.tripId ?? null);
      toast.success("Photo added successfully");
    },
    onError: () => {
      toast.error("Failed to add photo");
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => api.deleteMemoryPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["visitedCities"] });
      queryClient.invalidateQueries({ queryKey: ["pastTrips"] });
      void refreshTripPhotos(sheetStop?.tripId ?? null);
      toast.success("Photo deleted successfully");
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete photo");
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.user_id || !sheetStop?.tripId) return;

    try {
      const downloadUrl = await uploadMemoryPhoto({
        file,
        userId: user.user_id,
        tripId: sheetStop.tripId,
      });
      addPhotoMutation.mutate({ local_path: downloadUrl });
    } catch (error) {
      console.error("Failed to upload memory photo:", error);
      toast.error("Failed to upload photo");
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotoToDelete(photoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (photoToDelete) {
      deletePhotoMutation.mutate(photoToDelete);
    }
  };

  const handlePinClick = (stop: RouteStop) => {
    setSelectedStop(stop);
  };

  const getPetsForTrip = (tripId: string | number) => {
    const trip = pastTrips.find((t) => String(t.plan_id) === String(tripId));
    if (!trip || !trip.pet_ids) return [];
    const petIds = trip.pet_ids.split(',').map((id) => id.trim());
    return pets.filter((pet) => pet.pet_id && petIds.includes(String(pet.pet_id)));
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

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-bold text-foreground mb-2">Google Maps API key missing</h3>
          <p className="text-muted-foreground">
            Please set VITE_GOOGLE_MAPS_API_KEY in your environment to load the map.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-bold text-foreground mb-2">Map failed to load</h3>
          <p className="text-muted-foreground">
            Please check your Google Maps API settings and try again.
          </p>
        </div>
      </div>
    );
  }

  if (visitedCities.length === 0 && pastTrips.length === 0) {
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
        {isLoaded ? (
          <GoogleMap
            mapContainerClassName="h-full w-full"
            center={{ lat: 39.8283, lng: -98.5795 }}
            zoom={4}
            onLoad={(map) => setMapInstance(map)}
            onClick={() => setSelectedStop(null)}
            options={{
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false,
              clickableIcons: false,
              minZoom: 3,
              ...(GOOGLE_MAPS_MAP_ID ? { mapId: GOOGLE_MAPS_MAP_ID } : {}),
            }}
          >
            {routePaths.map((segment) => (
              <PolylineF
                key={`route-${segment.tripId}`}
                path={segment.path}
                options={{
                  strokeColor: segment.color,
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            ))}
            {selectedStop &&
              markerLocations.find(
                (loc) =>
                  loc.stop.cityName === selectedStop.cityName &&
                  String(loc.stop.tripId) === String(selectedStop.tripId)
              ) && (
                <InfoWindowF
                  position={
                    markerLocations.find(
                      (loc) =>
                        loc.stop.cityName === selectedStop.cityName &&
                        String(loc.stop.tripId) === String(selectedStop.tripId)
                    )!.position
                  }
                  onCloseClick={() => setSelectedStop(null)}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground">{selectedStop.cityName}</div>
                    <div className="text-xs text-muted-foreground">{formatCheckIn(selectedStop)}</div>
                    {getPetsForTrip(selectedStop.tripId).length > 0 && (
                      <div className="flex items-center gap-1 pt-1">
                        {getPetsForTrip(selectedStop.tripId).slice(0, 3).map((pet) => (
                          <Avatar key={pet.pet_id} className="w-6 h-6 border border-background">
                            {pet.avatar_url ? (
                              <AvatarImage src={pet.avatar_url} alt={pet.name} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {pet.name.substring(0, 1).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ))}
                        {getPetsForTrip(selectedStop.tripId).length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{getPetsForTrip(selectedStop.tripId).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStop(null);
                        setSheetStop(selectedStop);
                      }}
                      className="mt-2 w-full"
                    >
                      Manage Photos
                    </Button>
                  </div>
                </InfoWindowF>
              )}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* City Detail Sheet */}
      <Sheet open={!!sheetStop} onOpenChange={(open) => !open && setSheetStop(null)}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          {sheetStop && (
            <div className="h-full flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>{sheetStop.cityName}</SheetTitle>
                <SheetDescription>
                  View and manage photos from your trip to {sheetStop.cityName}
                </SheetDescription>
              </SheetHeader>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2" aria-hidden="true">
                    {sheetStop.cityName}
                  </h2>

                  {/* Pet avatars for selected trip */}
                  {sheetStop?.tripId && (
                    <div className="flex -space-x-2">
                      {getPetsForTrip(sheetStop.tripId).slice(0, 3).map((pet) => (
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
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Photos {cityPhotos.length > 0 && `(${cityPhotos.length})`}
                    </h3>
                    <div className="text-right">
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={addPhotoMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                      <p className="text-xs text-muted-foreground mt-0.5">Max 10MB</p>
                    </div>
                  </div>
                  <input
                    id="city-photo-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {cityPhotos.length === 0 ? (
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
                    <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {cityPhotos.map((photo) => (
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
