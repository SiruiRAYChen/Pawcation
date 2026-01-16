import { motion } from "framer-motion";
import { MapPin, Compass, User } from "lucide-react";
import { PawIcon } from "@/components/icons/PawIcon";

type Tab = "plan" | "explore" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: "plan" as Tab, label: "Plan", icon: MapPin },
  { id: "explore" as Tab, label: "Explore", icon: Compass },
  { id: "profile" as Tab, label: "Profile", icon: User },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full transition-colors"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                className={`relative p-2.5 transition-colors ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 flex items-center justify-center"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                  >
                    <PawIcon className="w-10 h-10 text-primary/20" />
                  </motion.div>
                )}
                <Icon className="w-5 h-5 relative z-10" />
              </motion.div>
              <span
                className={`text-xs font-semibold mt-0.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
