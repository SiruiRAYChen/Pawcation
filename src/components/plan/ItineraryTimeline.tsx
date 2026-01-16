import { motion } from "framer-motion";
import { Plane, Hotel, Coffee, TreePine, AlertTriangle, Thermometer } from "lucide-react";
import { ComplianceTag } from "@/components/ui/ComplianceTag";
import { PawIcon } from "@/components/icons/PawIcon";

interface TimelineItem {
  id: string;
  time: "morning" | "afternoon" | "evening";
  type: "transport" | "accommodation" | "dining" | "activity";
  title: string;
  subtitle: string;
  compliance: "approved" | "conditional" | "restricted";
  complianceNote?: string;
  icon?: React.ReactNode;
}

interface ItineraryDay {
  date: string;
  dayLabel: string;
  items: TimelineItem[];
  alerts?: { type: "weather" | "warning"; message: string }[];
}

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

const timeLabels = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const typeIcons = {
  transport: Plane,
  accommodation: Hotel,
  dining: Coffee,
  activity: TreePine,
};

export const ItineraryTimeline = ({ days }: ItineraryTimelineProps) => {
  return (
    <div className="space-y-6">
      {days.map((day, dayIndex) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIndex * 0.1 }}
          className="space-y-3"
        >
          {/* Day Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {dayIndex + 1}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">{day.dayLabel}</h3>
                <p className="text-xs text-muted-foreground">{day.date}</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {day.alerts?.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 p-3 rounded-xl ${
                alert.type === "weather"
                  ? "bg-warning/10 border border-warning/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              {alert.type === "weather" ? (
                <Thermometer className="w-4 h-4 text-warning-foreground" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
              <p className="text-sm font-medium">{alert.message}</p>
            </motion.div>
          ))}

          {/* Timeline Items */}
          <div className="space-y-3 pl-4 border-l-2 border-border ml-5">
            {day.items.map((item, itemIndex) => {
              const Icon = typeIcons[item.type];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIndex * 0.1 + itemIndex * 0.05 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[1.35rem] top-4 w-3 h-3 rounded-full bg-card border-2 border-primary" />
                  
                  <div className="bg-card rounded-xl p-4 shadow-paw border border-border ml-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.type === "transport" ? "bg-accent/10 text-accent" :
                          item.type === "accommodation" ? "bg-primary/10 text-primary" :
                          item.type === "dining" ? "bg-secondary text-secondary-foreground" :
                          "bg-success/10 text-success"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {timeLabels[item.time]}
                          </p>
                          <h4 className="font-bold text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        </div>
                      </div>
                      <ComplianceTag status={item.compliance} />
                    </div>
                    {item.complianceNote && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                        <PawIcon className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{item.complianceNote}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
