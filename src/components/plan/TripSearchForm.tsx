import { PawIcon } from "@/components/icons/PawIcon";
import { getTripLengthDays, MAX_TRIP_DAYS, validateDateRange } from "@/components/plan/dateRangeUtils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { api, Pet } from "@/lib/api";
import { format, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Car, DollarSign, MapPin, Plane, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { PlaceAutocomplete } from "./PlaceAutocomplete";

interface TripSearchFormProps {
  onSearch: (data: TripSearchData) => void;
  travelMode?: "flight" | "roadtrip";
}

export interface TripSearchData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  selectedPets: Pet[];
  adults: number;
  children: number;
  isRoundTrip?: boolean;
  travelMode: "flight" | "roadtrip";
  budget: number;
}

export const TripSearchForm = ({ onSearch, travelMode = "flight" }: TripSearchFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [formData, setFormData] = useState<TripSearchData>({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    selectedPets: [],
    adults: 2,
    children: 0,
    isRoundTrip: true,
    travelMode: travelMode,
    budget: 1500,
  });

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, travelMode }));
  }, [travelMode]);

  useEffect(() => {
    const loadPets = async () => {
      if (!user?.user_id) {
        setIsLoadingPets(false);
        return;
      }
      try {
        const userPets = await api.getUserPets(user.user_id);
        setPets(userPets);
        if (userPets.length > 0) {
          setSelectedPets([userPets[0]]);
          setFormData(prev => ({ ...prev, selectedPets: [userPets[0]] }));
        }
      } catch (error) {
        console.error("Failed to load pets:", error);
      } finally {
        setIsLoadingPets(false);
      }
    };
    loadPets();
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const formatDateInput = (date: Date) => format(date, "yyyy-MM-dd");

  const handleDayClick = (day: Date) => {
    if (day < today) return;

    if (!dateRange?.from || (dateRange.from && dateRange.to)) {
      setDateRange({ from: day, to: undefined });
      setFormData({
        ...formData,
        startDate: formatDateInput(day),
        endDate: "",
      });
      return;
    }

    if (dateRange.from && !dateRange.to) {
      if (day <= dateRange.from) {
        setDateRange({ from: day, to: undefined });
        setFormData({
          ...formData,
          startDate: formatDateInput(day),
          endDate: "",
        });
        return;
      }

      const nextRange: DateRange = { from: dateRange.from, to: day };
      const validation = validateDateRange(nextRange, today, MAX_TRIP_DAYS);

      if (!validation.valid) {
        if (validation.reason === "too-long") {
          toast({
            title: "Trip length limit",
            description:
              "Sorry — trips longer than 7 days aren’t supported yet. Please choose a shorter end date.",
            variant: "destructive",
          });
        } else if (validation.reason === "end-not-after-start") {
          toast({
            title: "End date required",
            description: "End date must be after the start date.",
            variant: "destructive",
          });
        }

        setDateRange({ from: dateRange.from, to: undefined });
        setFormData({
          ...formData,
          startDate: formatDateInput(dateRange.from),
          endDate: "",
        });
        return;
      }

      setDateRange(nextRange);
      setFormData({
        ...formData,
        startDate: formatDateInput(dateRange.from),
        endDate: formatDateInput(day),
      });
    }
  };

  const rangeLabel = useMemo(() => {
    if (!dateRange?.from) return "Select your travel dates";
    if (!dateRange?.to) return `${format(dateRange.from, "MMM d")}`;
    const days = getTripLengthDays(dateRange.from, dateRange.to);
    return `${format(dateRange.from, "MMM d")} → ${format(dateRange.to, "MMM d")} (${days} days, inclusive)`;
  }, [dateRange]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl shadow-paw-lg p-5 space-y-4 border border-border"
    >
      {/* Pet Selection */}
      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
        <p className="text-sm font-semibold mb-2">Traveling with</p>
        {isLoadingPets ? (
          <p className="text-sm text-muted-foreground">Loading pets...</p>
        ) : pets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pets added yet</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tap to select pets (at least one required)</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pets.map((pet) => {
                const isSelected = selectedPets.some((selected) => selected.pet_id === pet.pet_id);
                return (
                  <button
                    key={pet.pet_id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedPets.length === 1) return;
                        const next = selectedPets.filter((selected) => selected.pet_id !== pet.pet_id);
                        setSelectedPets(next);
                        setFormData({ ...formData, selectedPets: next });
                      } else {
                        const next = [...selectedPets, pet];
                        setSelectedPets(next);
                        setFormData({ ...formData, selectedPets: next });
                      }
                    }}
                    className={`min-w-[160px] flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {pet.avatar_url ? (
                      <img
                        src={pet.avatar_url}
                        alt={pet.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <PawIcon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium truncate">
                        {pet.name || "Unnamed Pet"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Origin & Destination */}
      <div className="space-y-3">
        <PlaceAutocomplete
          value={formData.origin}
          onChange={(value) => setFormData({ ...formData, origin: value })}
          placeholder="From (e.g., San Francisco, CA)"
          className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
          icon={<MapPin />}
        />
        <PlaceAutocomplete
          value={formData.destination}
          onChange={(value) => setFormData({ ...formData, destination: value })}
          placeholder="To (e.g., Los Angeles, CA)"
          className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
          icon={travelMode === "flight" ? <Plane className="text-accent" /> : <Car className="text-accent" />}
        />
      </div>

      {/* Round Trip Toggle (only for road trips) */}
      {travelMode === "roadtrip" && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
          <label className="text-sm font-medium cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRoundTrip}
              onChange={(e) => setFormData({ ...formData, isRoundTrip: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            Round Trip
          </label>
          <span className="text-xs text-muted-foreground">
            {formData.isRoundTrip ? "Different route back" : "One-way journey"}
          </span>
        </div>
      )}

      {/* Dates */}
      <div className="space-y-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-left transition-colors hover:bg-muted"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span>Dates</span>
                </div>
                <p className="text-xs text-muted-foreground">{rangeLabel}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="center">
            <Calendar
              mode="range"
              selected={dateRange}
              onDayClick={handleDayClick}
              numberOfMonths={isMobile ? 1 : 2}
              disabled={{ before: today }}
            />
          </PopoverContent>
        </Popover>
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

      {/* Budget Slider */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success" />
            <p className="text-sm font-medium">Budget</p>
          </div>
          <span className="text-lg font-bold text-success">
            {formData.budget === 100 
              ? "$100-" 
              : formData.budget === 5000 
              ? "$5,000+" 
              : `$${formData.budget.toLocaleString()}`}
          </span>
        </div>
        <Slider
          value={[formData.budget]}
          onValueChange={(value) => setFormData({ ...formData, budget: value[0] })}
          min={100}
          max={5000}
          step={50}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$100-</span>
          <span>$5,000+</span>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-14 text-lg font-bold rounded-xl gradient-primary shadow-glow hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {travelMode === "flight" ? "Generate Itinerary" : "Plan Road Trip"}
      </Button>
    </motion.form>
  );
};
