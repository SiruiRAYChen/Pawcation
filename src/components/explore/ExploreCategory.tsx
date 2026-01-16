import { motion } from "framer-motion";
import { Plane, Hotel, UtensilsCrossed, TreePine, ChevronRight } from "lucide-react";

interface ExploreCategoryProps {
  onCategoryClick?: (category: string) => void;
}

const categories = [
  {
    id: "transport",
    title: "Transportation",
    description: "Airlines, trains & car rentals",
    icon: Plane,
    color: "bg-accent/10 text-accent",
    count: "50+ policies",
  },
  {
    id: "accommodation",
    title: "Accommodation",
    description: "Hotels, Airbnbs & rentals",
    icon: Hotel,
    color: "bg-primary/10 text-primary",
    count: "200+ listings",
  },
  {
    id: "dining",
    title: "Dining",
    description: "Pet-friendly restaurants & cafes",
    icon: UtensilsCrossed,
    color: "bg-secondary text-secondary-foreground",
    count: "1000+ spots",
  },
  {
    id: "outdoor",
    title: "Outdoor & Parks",
    description: "Trails, beaches & dog parks",
    icon: TreePine,
    color: "bg-success/10 text-success",
    count: "500+ places",
  },
];

export const ExploreCategory = ({ onCategoryClick }: ExploreCategoryProps) => {
  return (
    <div className="space-y-3">
      {categories.map((category, index) => {
        const Icon = category.icon;
        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onCategoryClick?.(category.id)}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-paw border border-border hover:border-primary/30 hover:shadow-paw-lg transition-all active:scale-[0.98]"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-foreground">{category.title}</h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {category.count}
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
