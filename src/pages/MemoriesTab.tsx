import { PawIcon } from "@/components/icons/PawIcon";
import { motion } from "framer-motion";
import { BookOpen, Map } from "lucide-react";
import { useState } from "react";
import { MapsPage } from "./MapsPage";
import { PastTripsPage } from "./PastTripsPage";

export const MemoriesTab = () => {
  const [activeTab, setActiveTab] = useState<"trips" | "map">("trips");

  return (
    <div className="h-screen flex flex-col pb-16">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 safe-top bg-background border-b">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <PawIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Memories</h1>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("trips")}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === "trips"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Past Trips
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === "map"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Map className="w-4 h-4" />
            Maps
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "trips" ? <PastTripsPage /> : <MapsPage />}
      </div>
    </div>
  );
};
