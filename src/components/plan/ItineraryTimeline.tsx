import { PawIcon } from "@/components/icons/PawIcon";
import { ComplianceTag } from "@/components/ui/ComplianceTag";
import { motion } from "framer-motion";
import { AlertTriangle, Coffee, DollarSign, Hotel, Plane, Thermometer, TreePine } from "lucide-react";

interface TimelineItem {
  id: string;
  time: "morning" | "afternoon" | "evening";
  type: "transport" | "accommodation" | "dining" | "activity";
  title: string;
  subtitle: string;
  compliance: "approved" | "conditional" | "notAllowed";
  complianceNote?: string;
  icon?: React.ReactNode;
  estimated_cost?: number;
}

interface ItineraryDay {
  date: string;
  dayLabel: string;
  items: TimelineItem[];
  alerts?: { type: "weather" | "warning"; message: string }[];
}

interface ItineraryTimelineProps {
  days: ItineraryDay[];
  total_estimated_cost?: number;
  budget?: number;
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

export const ItineraryTimeline = ({ days, total_estimated_cost, budget }: ItineraryTimelineProps) => {
  const isOverBudget = budget && total_estimated_cost && total_estimated_cost > budget;
  
  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      {(total_estimated_cost || budget) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-2 ${
            isOverBudget 
              ? "bg-destructive/10 border-destructive" 
              : "bg-success/10 border-success"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-5 h-5 ${isOverBudget ? "text-destructive" : "text-success"}`} />
              <div>
                <p className="text-sm font-semibold">Estimated Total Cost</p>
                {budget && (
                  <p className="text-xs text-muted-foreground">
                    Budget: ${budget.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-success"}`}>
                ${total_estimated_cost?.toLocaleString() || "0"}
              </p>
              {budget && total_estimated_cost && (
                <p className={`text-xs ${isOverBudget ? "text-destructive" : "text-success"}`}>
                  {isOverBudget ? "Over budget" : `${Math.round((total_estimated_cost / budget) * 100)}% of budget`}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
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
                          {item.estimated_cost !== undefined && item.estimated_cost > 0 && (
                            <p className="text-xs font-semibold text-success mt-1">
                              ${item.estimated_cost.toFixed(2)}
                            </p>
                          )}
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
