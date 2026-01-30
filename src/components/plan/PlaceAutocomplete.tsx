import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

interface Prediction {
  place_id: string;
  description: string;
  full_address?: string;
}

export const PlaceAutocomplete = ({
  value,
  onChange,
  placeholder,
  className,
  icon,
}: PlaceAutocompleteProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      return;
    }

    console.log("Fetching predictions for:", input);
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/places/autocomplete?input=${encodeURIComponent(input)}`
      );
      
      if (!response.ok) {
        console.error("API response not OK:", response.status, response.statusText);
        setPredictions([]);
        return;
      }
      
      const data = await response.json();
      console.log("Received predictions:", data.predictions?.length || 0);
      
      if (data.predictions && data.predictions.length > 0) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      } else {
        console.log("No predictions found");
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Failed to fetch place predictions:", error);
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelectPrediction = (prediction: Prediction) => {
    // Use the clean "City, State" format from the backend
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">{icon}</div>}
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="text-sm font-medium text-foreground">
                {prediction.description}
              </div>
              {prediction.full_address && prediction.full_address !== prediction.description && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {prediction.full_address}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
