import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, Plane, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PawIcon } from "@/components/icons/PawIcon";

interface TripSearchFormProps {
  onSearch: (data: TripSearchData) => void;
}

export interface TripSearchData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  pets: string[];
  adults: number;
  children: number;
}

export const TripSearchForm = ({ onSearch }: TripSearchFormProps) => {
  const [formData, setFormData] = useState<TripSearchData>({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    pets: ["buddy"],
    adults: 2,
    children: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl shadow-paw-lg p-5 space-y-4 border border-border"
    >
      {/* Pet Selection */}
      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <PawIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Traveling with</p>
          <p className="text-sm text-muted-foreground">Buddy the Corgi</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-primary">
          Change
        </Button>
      </div>

      {/* Origin & Destination */}
      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="From (e.g., San Francisco)"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
          />
        </div>
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
          <Input
            placeholder="To (e.g., Los Angeles)"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="pl-10 h-12 bg-muted/50 border-border rounded-xl text-sm"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="pl-10 h-12 bg-muted/50 border-border rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Travelers */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
        <Users className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Humans</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Adults</span>
            <select
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: Number(e.target.value) })}
              className="bg-card border border-border rounded-lg px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Kids</span>
            <select
              value={formData.children}
              onChange={(e) => setFormData({ ...formData, children: Number(e.target.value) })}
              className="bg-card border border-border rounded-lg px-2 py-1 text-sm"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-14 text-lg font-bold rounded-xl gradient-primary shadow-glow hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Generate Itinerary
      </Button>
    </motion.form>
  );
};
