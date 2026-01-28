import { ExploreCategory } from "@/components/explore/ExploreCategory";
import { PawIcon } from "@/components/icons/PawIcon";
import { motion } from "framer-motion";

export const ExploreTab = () => {
  return (
    <div className="min-h-screen pb-24 gradient-hero">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <PawIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground">Explore</h1>
        </motion.div>
        <p className="text-muted-foreground">
          Discover pet-friendly policies & places
        </p>
      </div>

      {/* Categories */}
      <div className="px-2">
        <ExploreCategory />
      </div>

    </div>
  );
};
