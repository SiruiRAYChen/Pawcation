import heroDog from "@/assets/dog-flight.png";
import roadDog from "@/assets/dog-road-trip.png";
import { PawIcon } from "@/components/icons/PawIcon";
import { ItineraryTimeline } from "@/components/plan/ItineraryTimeline";
import { TripSearchData, TripSearchForm } from "@/components/plan/TripSearchForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, ItineraryDay, Plan } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Calendar, Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";

export const PlanTab = () => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [travelMode, setTravelMode] = useState<"flight" | "roadtrip">("flight");
  const [isFlipping, setIsFlipping] = useState(false);
  const [tripData, setTripData] = useState<TripSearchData | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [totalCost, setTotalCost] = useState<number | undefined>(undefined);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadPlans = async () => {
      if (!user?.user_id) {
        setIsLoadingPlans(false);
        return;
      }
      try {
        const plans = await api.getUserPlans(user.user_id);
        setSavedPlans(plans);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    loadPlans();
  }, [user]);

  const handleSearch = async (data: TripSearchData) => {
    if (!data.selectedPet) {
      toast({
        title: "No pet selected",
        description: "Please select a pet to travel with",
        variant: "destructive",
      });
      return;
    }

    if (!data.origin || !data.destination || !data.startDate || !data.endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setTripData(data);
    setIsGenerating(true);
    setShowItinerary(true);

    try {
      let response;
      if (data.travelMode === "roadtrip") {
        response = await api.generateRoadTripItinerary({
          origin: data.origin,
          destination: data.destination,
          start_date: data.startDate,
          end_date: data.endDate,
          pet_id: data.selectedPet.pet_id!,
          num_adults: data.adults,
          num_children: data.children,
          is_round_trip: data.isRoundTrip ?? false,
          budget: data.budget,
        });
      } else {
        response = await api.generateItinerary({
          origin: data.origin,
          destination: data.destination,
          start_date: data.startDate,
          end_date: data.endDate,
          pet_id: data.selectedPet.pet_id!,
          num_adults: data.adults,
          num_children: data.children,
          budget: data.budget,
        });
      }

      setItinerary(response.days);
      setTotalCost(response.total_estimated_cost);
      setBudget(response.budget);
      toast({
        title: `${data.travelMode === "roadtrip" ? "Road trip" : "Itinerary"} generated! 🎉`,
        description: `Your pet-friendly ${data.travelMode === "roadtrip" ? "road trip" : "trip"} to ${data.destination} is ready`,
      });
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate itinerary. Please try again.",
        variant: "destructive",
      });
      setShowItinerary(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setShowItinerary(false);
  };

  const handleTravelModeToggle = (mode: "flight" | "roadtrip") => {
    if (mode === travelMode || isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setTravelMode(mode);
      setIsFlipping(false);
    }, 300);
  };

  const handleSavePlan = async () => {
    if (!user?.user_id || !tripData?.selectedPet || itinerary.length === 0) {
      toast({
        title: "Cannot save",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const savedPlan = await api.savePlan({
        user_id: user.user_id,
        origin: tripData.origin,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        pet_ids: String(tripData.selectedPet.pet_id),
        num_adults: tripData.adults,
        num_children: tripData.children,
        trip_type: tripData.travelMode === "roadtrip" ? "Road Trip" : "Direct Trip",
        is_round_trip: tripData.isRoundTrip ?? false,
        detailed_itinerary: JSON.stringify({ days: itinerary }),
      });

      setSavedPlans([...savedPlans, savedPlan]);
      toast({
        title: "Trip saved! 🎉",
        description: "Your itinerary has been saved to your plans",
      });
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewPlan = (plan: Plan) => {
    try {
      const parsedItinerary = JSON.parse(plan.detailed_itinerary || "{}");
      setItinerary(parsedItinerary.days || []);
      setTotalCost(parsedItinerary.total_estimated_cost);
      setBudget(parsedItinerary.budget || plan.budget);
      setTripData({
        origin: plan.origin || "",
        destination: plan.destination || "",
        startDate: plan.start_date,
        endDate: plan.end_date,
        selectedPet: null,
        adults: plan.num_adults,
        children: plan.num_children,
        travelMode: plan.trip_type === "Road Trip" ? "roadtrip" : "flight",
        isRoundTrip: plan.is_round_trip ?? false,
        budget: plan.budget || 2000,
      });
      setShowItinerary(true);
    } catch (error) {
      console.error("Failed to parse plan:", error);
      toast({
        title: "Error",
        description: "Failed to load saved plan",
        variant: "destructive",
      });
    }
  };

  // Separate plans into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingPlans = savedPlans.filter(plan => new Date(plan.start_date) >= today);
  const pastPlans = savedPlans.filter(plan => new Date(plan.start_date) < today);

  return (
    <div className="min-h-screen pb-24">
      <AnimatePresence mode="wait">
        {!showItinerary ? (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gradient-hero min-h-screen"
          >
            {/* Hero Section */}
            <div className="relative pt-8 px-4 pb-6">
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full"
                >
                  <PawIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Pet-First Travel</span>
                </motion.div>
                <h1 className="text-3xl font-extrabold text-foreground">
                  Where to next?
                </h1>
                <p className="text-muted-foreground">
                  {travelMode === "flight" 
                    ? "Plan trips approved by paws, not just people"
                    : "Hit the road with your furry co-pilot"}
                </p>
              </div>
              
              {/* Hero Image Selector */}
              <div className="relative mt-4 mx-auto flex items-center justify-center gap-6">
                {/* Road Trip Dog (Left) */}
                <motion.div
                  onClick={() => handleTravelModeToggle("roadtrip")}
                  className="relative w-36 h-36 cursor-pointer"
                  animate={{
                    scale: travelMode === "roadtrip" ? 1 : 0.7,
                    opacity: travelMode === "roadtrip" ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: travelMode === "roadtrip" ? 1.05 : 0.75 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.img
                    src={roadDog}
                    alt="Road trip with your pet"
                    className="w-full h-full object-contain drop-shadow-lg"
                    animate={{
                      rotateY: isFlipping && travelMode === "flight" ? 360 : 0,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                  {travelMode === "roadtrip" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full"
                    >
                      Road Trip
                    </motion.div>
                  )}
                </motion.div>

                {/* Flight Dog (Right) */}
                <motion.div
                  onClick={() => handleTravelModeToggle("flight")}
                  className="relative w-36 h-36 cursor-pointer"
                  animate={{
                    scale: travelMode === "flight" ? 1 : 0.7,
                    opacity: travelMode === "flight" ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: travelMode === "flight" ? 1.05 : 0.75 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.img
                    src={heroDog}
                    alt="Happy dog ready to travel"
                    className="w-full h-full object-contain drop-shadow-lg"
                    animate={{
                      rotateY: isFlipping && travelMode === "roadtrip" ? 360 : 0,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                  {travelMode === "flight" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded-full"
                    >
                      Flight
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Search Form */}
            <motion.div 
              key={travelMode}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 -mt-4"
            >
              <TripSearchForm onSearch={handleSearch} travelMode={travelMode} />
            </motion.div>

            {/* Saved Plans */}
            <div className="px-4 mt-6 space-y-6">
              {/* Upcoming Trips */}
              {upcomingPlans.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Upcoming Trips</h2>
                  <div className="space-y-3">
                    {upcomingPlans.map((plan) => (
                      <motion.div
                        key={plan.plan_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-xl p-4 border border-border shadow-paw cursor-pointer hover:shadow-paw-lg transition-shadow"
                        onClick={() => handleViewPlan(plan)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{plan.destination}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Trips */}
              {pastPlans.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Past Trips</h2>
                  <div className="space-y-3">
                    {pastPlans.map((plan) => (
                      <motion.div
                        key={plan.plan_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-xl p-4 border border-border shadow-paw cursor-pointer hover:shadow-paw-lg transition-shadow opacity-75"
                        onClick={() => handleViewPlan(plan)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-accent" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{plan.destination}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingPlans && savedPlans.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No saved trips yet. Create your first adventure above! ✨</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-background min-h-screen"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border safe-top">
              <div className="flex items-center gap-3 px-4 py-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <h1 className="font-bold text-foreground">
                    {tripData?.destination || "Your"} Trip
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {itinerary.length} days • {tripData?.selectedPet?.name || "Your pet"}
                    {tripData?.travelMode === "roadtrip" && tripData?.isRoundTrip && " • Round Trip 🔄"}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-semibold text-success">
                    {tripData?.travelMode === "roadtrip" ? "🚗 Road Trip" : "AI Generated"}
                  </span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {tripData?.travelMode === "roadtrip" 
                    ? "Mapping your pet-friendly road trip..."
                    : "Crafting your pet-friendly adventure..."}
                </h2>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {tripData?.travelMode === "roadtrip"
                    ? `Our AI is finding the best routes, rest stops, and pet-friendly places along the way for ${tripData?.selectedPet?.name}`
                    : `Our AI is analyzing pet-friendly accommodations, activities, and travel options for ${tripData?.selectedPet?.name}`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Save Button */}
                <div className="px-4 pt-4">
                  <Button
                    onClick={handleSavePlan}
                    disabled={isSaving}
                    className="w-full gradient-primary shadow-glow"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Trip
                      </>
                    )}
                  </Button>
                </div>

                {/* Itinerary */}
                <div className="px-4 pb-6">
                  <ItineraryTimeline 
                    days={itinerary} 
                    total_estimated_cost={totalCost}
                    budget={budget}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
