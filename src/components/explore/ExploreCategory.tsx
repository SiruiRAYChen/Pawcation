import { motion } from "framer-motion";
import { Plane, Building, UtensilsCrossed, TreePine, Stethoscope, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExploreCategoryProps {
  onCategoryClick?: (category: string) => void;
}

const categories = [
  {
    id: "transit",
    title: "Transit",
    description: "Airlines, Trains, Policies",
    icon: Plane,
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "accommodation", 
    title: "Hotels",
    description: "Hotels, Airbnb, Pet Fees",
    icon: Building,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "dining",
    title: "Dining", 
    description: "Restaurants, Cafes, Pet Menu",
    icon: UtensilsCrossed,
    color: "bg-pink-50 text-pink-600",
  },
  {
    id: "outdoor",
    title: "Outdoor",
    description: "Parks, Hiking, Leash Rules",
    icon: TreePine,
    color: "bg-green-50 text-green-600",
  },
  {
    id: "vet",
    title: "Hospital",
    description: "Clinics, Emergency, Specialists",
    icon: Stethoscope,
    color: "bg-red-50 text-red-600",
  },
  {
    id: "services",
    title: "Pet Services",
    description: "Grooming, Boarding, Supplies",
    icon: ShoppingBag,
    color: "bg-orange-50 text-orange-600",
  },
];

export const ExploreCategory = ({ onCategoryClick }: ExploreCategoryProps) => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'transit') {
      navigate('/transit');
    } else if (categoryId === 'accommodation') {
      navigate('/hotels');
    } else if (categoryId === 'dining') {
      navigate('/dining');
    } else if (categoryId === 'outdoor') {
      navigate('/outdoor');
    } else if (categoryId === 'vet') {
      navigate('/hospital');
    } else if (categoryId === 'services') {
      navigate('/pet-services');
    } else {
      // For other categories, use the callback if provided
      onCategoryClick?.(categoryId);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 px-2">
      {categories.map((category, index) => {
        const Icon = category.icon;
        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleCategoryClick(category.id)}
            className="h-28 flex flex-col items-start justify-start p-4 bg-card rounded-2xl shadow-paw border border-border hover:border-primary/30 hover:shadow-paw-lg transition-all active:scale-95"
          >
            <div className="flex items-center gap-4 w-full">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left flex flex-col">
                <div className="h-6 flex items-center">
                  <h3 className="font-bold text-base text-foreground leading-tight">
                    {category.title}
                  </h3>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground leading-snug">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
