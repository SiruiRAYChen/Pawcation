import { ExploreCategory } from "@/components/explore/ExploreCategory";
import { PawIcon } from "@/components/icons/PawIcon";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export const ExploreTab = () => {
  return (
    <div className="min-h-screen pb-24 gradient-hero">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 safe-top">
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

      {/* Search */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search airlines, hotels, restaurants..."
            className="pl-12 h-14 bg-card border-border rounded-2xl shadow-paw text-base"
          />
        </motion.div>
      </div>

      {/* Categories */}
      <div className="px-4">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-foreground mb-4"
        >
          Browse by Category
        </motion.h2>
        <ExploreCategory />
      </div>

      {/* Coming Soon Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-4 mt-8 p-4 bg-card rounded-2xl border border-dashed border-primary/30 text-center"
      >
        <PawIcon className="w-8 h-8 text-primary/50 mx-auto mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Full policy database coming soon!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          We're sniffing out the best pet-friendly spots for you.
        </p>
      </motion.div>
    </div>
  );
};
