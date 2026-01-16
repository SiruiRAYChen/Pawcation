import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { TripSearchForm, TripSearchData } from "@/components/plan/TripSearchForm";
import { ItineraryTimeline } from "@/components/plan/ItineraryTimeline";
import { Button } from "@/components/ui/button";
import { PawIcon } from "@/components/icons/PawIcon";
import heroDog from "@/assets/hero-dog.png";

// Sample itinerary data
const sampleItinerary = [
  {
    date: "Sat, Feb 15",
    dayLabel: "Travel Day",
    items: [
      {
        id: "1",
        time: "morning" as const,
        type: "transport" as const,
        title: "United Airlines UA234",
        subtitle: "SFO → LAX • 1h 25m",
        compliance: "approved" as const,
        complianceNote: "Buddy fits in cabin carrier (under 20 lbs)",
      },
      {
        id: "2",
        time: "afternoon" as const,
        type: "accommodation" as const,
        title: "Kimpton Hotel Palomar",
        subtitle: "Check-in at 3:00 PM",
        compliance: "approved" as const,
        complianceNote: "No pet fee, water bowl provided",
      },
      {
        id: "3",
        time: "evening" as const,
        type: "dining" as const,
        title: "The Dog Cafe LA",
        subtitle: "Pet-friendly patio dining",
        compliance: "approved" as const,
      },
    ],
  },
  {
    date: "Sun, Feb 16",
    dayLabel: "Beach Day",
    alerts: [
      {
        type: "weather" as const,
        message: "🌡️ High of 85°F — Pack extra water for Buddy!",
      },
    ],
    items: [
      {
        id: "4",
        time: "morning" as const,
        type: "activity" as const,
        title: "Huntington Dog Beach",
        subtitle: "Off-leash beach paradise",
        compliance: "approved" as const,
      },
      {
        id: "5",
        time: "afternoon" as const,
        type: "dining" as const,
        title: "Lazy Dog Restaurant",
        subtitle: "Lunch with pup menu",
        compliance: "conditional" as const,
        complianceNote: "Dogs allowed on patio only",
      },
      {
        id: "6",
        time: "evening" as const,
        type: "activity" as const,
        title: "Santa Monica Pier",
        subtitle: "Evening stroll",
        compliance: "conditional" as const,
        complianceNote: "Dogs must be leashed, no pets in arcade",
      },
    ],
  },
  {
    date: "Mon, Feb 17",
    dayLabel: "Return Home",
    items: [
      {
        id: "7",
        time: "morning" as const,
        type: "accommodation" as const,
        title: "Kimpton Hotel Palomar",
        subtitle: "Check-out by 11:00 AM",
        compliance: "approved" as const,
      },
      {
        id: "8",
        time: "afternoon" as const,
        type: "transport" as const,
        title: "United Airlines UA567",
        subtitle: "LAX → SFO • 1h 20m",
        compliance: "approved" as const,
      },
    ],
  },
];

export const PlanTab = () => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [tripData, setTripData] = useState<TripSearchData | null>(null);

  const handleSearch = (data: TripSearchData) => {
    setTripData(data);
    setShowItinerary(true);
  };

  const handleBack = () => {
    setShowItinerary(false);
  };

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
                  Plan trips approved by paws, not just people
                </p>
              </div>
              
              {/* Hero Image */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mt-4 mx-auto w-48 h-48"
              >
                <img
                  src={heroDog}
                  alt="Happy dog ready to travel"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </motion.div>
            </div>

            {/* Search Form */}
            <div className="px-4 -mt-4">
              <TripSearchForm onSearch={handleSearch} />
            </div>

            {/* Past Trips */}
            <div className="px-4 mt-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Recent Adventures</h2>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-4 border border-border shadow-paw"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">San Diego Beach Trip</p>
                    <p className="text-sm text-muted-foreground">Jan 20-22, 2024 • with Buddy</p>
                  </div>
                </div>
              </motion.div>
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
                    {tripData?.destination || "Los Angeles"} Trip
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    3 days • Buddy the Corgi
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-semibold text-success">AI Generated</span>
                </div>
              </div>
            </div>

            {/* Itinerary */}
            <div className="px-4 py-6">
              <ItineraryTimeline days={sampleItinerary} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
