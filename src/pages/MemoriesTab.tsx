import { PawIcon } from "@/components/icons/PawIcon";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export const MemoriesTab = () => {
  return (
    <div className="min-h-screen pb-24 gradient-hero">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <PawIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Memories</h1>
          </div>
        </motion.div>
        <p className="text-muted-foreground mt-1">
          Places you've explored together
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-8 border border-border shadow-paw"
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Your Travel Map
              </h3>
              <p className="text-muted-foreground">
                An interactive map showing all the places you've visited with your pets will appear here.
              </p>
            </div>
            <div className="pt-4 text-sm text-muted-foreground">
              <p className="mb-2">Coming soon:</p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Interactive US map with your travel history</li>
                <li>Pet avatars marking visited cities</li>
                <li>View past trip itineraries by clicking locations</li>
                <li>Road trip routes highlighted on the map</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
