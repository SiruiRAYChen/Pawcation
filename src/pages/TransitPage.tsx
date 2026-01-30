import { PawIcon } from "@/components/icons/PawIcon";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api, Pet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Loader2, ArrowLeft, Plane, Train, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Detailed transit data
const TRANSIT_DATA = [
  {
    "id": "alaska",
    "name": "Alaska Airlines",
    "official_url": "https://www.alaskaair.com/content/travel-info/policies/pets-traveling-with-pets",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/alaska_airlines/",
    "cabin": {
      "allowed": true,
      "fee": 100,
      "max_dimensions": "Hard: 17x11x7.5 in / Soft: 17x11x9.5 in",
      "weight_limit": "None (Must fit under seat)",
      "notes": [],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Required within 10 days of travel for interstate flights",
      "vaccine_requirements": ["Rabies vaccination required", "Proof of vaccination required"],
      "breed_restrictions": "None",
      "booking_requirements": "Must call to reserve pet space at least 48 hours before departure",
      "carrier_requirements": "Must be leak-proof, secure, and properly ventilated"
    },
    "cargo": {
      "allowed": true,
      "fee": 150,
      "weight_limit": "150 lbs (Pet + Carrier)",
      "restrictions": "No Brachycephalic (short-nosed) dogs.",
      "temperature_restrictions": "Not available when temps below 45°F or above 85°F at any location",
      "carrier_requirements": "IATA-compliant crate required"
    },
    "standout_warning": "Alaska is the most pet-friendly, but strict on soft carrier height (9.5\"). Confirm carrier size!"
  },
  {
    "id": "amtrak",
    "name": "Amtrak",
    "official_url": "https://www.amtrak.com/pets",
    "bringfido_url": null,
    "cabin": {
      "allowed": true,
      "fee": 29,
      "max_dimensions": "19x14x10.5 in",
      "weight_limit": "20 lbs (Combined)",
      "notes": ["Maximum trip duration: 7 hours"],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Required for travel",
      "vaccine_requirements": ["Current rabies vaccination", "Vaccination record must be presented at time of check-in"],
      "breed_restrictions": "None specified",
      "booking_requirements": "Reserve online at least 24 hours before departure or call customer service",
      "carrier_requirements": "Pet must remain in carrier entire journey, carrier stored under seat",
      "quantity_limit": "Maximum 5 pets per train"
    },
    "cargo": { "allowed": false },
    "standout_warning": "Strict 20 lbs limit including carrier. They WILL weigh it. Only for trips under 7 hours."
  },
  {
    "id": "delta",
    "name": "Delta Airlines",
    "official_url": "https://www.delta.com/us/en/pet-travel/overview",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/delta/",
    "cabin": {
      "allowed": true,
      "fee": 95,
      "max_dimensions": "Varies by aircraft (Rec: 18x11x11 in)",
      "weight_limit": "None",
      "notes": ["Pet space is first come, first served - cannot be reserved in advance"],
      "age_requirement": "Minimum 10 weeks old for domestic, 16 weeks for international",
      "health_certificate": "Not required for domestic; required for international travel",
      "vaccine_requirements": ["Rabies vaccination for international flights"],
      "breed_restrictions": "No snub-nosed breeds (brachycephalic)",
      "booking_requirements": "Cannot book online - must call or check in at airport",
      "carrier_requirements": "Soft-sided carrier recommended, must fit under seat",
      "quantity_limit": "Limited to availability, varies by aircraft"
    },
    "cargo": {
      "allowed": false,
      "notes": ["Active Military Only or via Delta Cargo shipping service (complex)."]
    },
    "standout_warning": "Pet counts as your carry-on bag. You check in at the Special Service Counter."
  },
  {
    "id": "american",
    "name": "American Airlines",
    "official_url": "https://www.aa.com/i18n/travel-info/special-assistance/pets.jsp",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/american_airlines/",
    "cabin": {
      "allowed": true,
      "fee": 150,
      "max_dimensions": "Hard: 19x13x9 in / Soft: 18x11x11 in",
      "weight_limit": "None (Must stand & turn)",
      "notes": [],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Required for international travel only",
      "vaccine_requirements": ["Rabies vaccination required", "Proof must be available upon request"],
      "breed_restrictions": "No brachycephalic (snub-nosed) breeds",
      "booking_requirements": "Must be booked at least 48 hours in advance by calling reservations",
      "carrier_requirements": "Pet must be able to stand and turn around comfortably",
      "quantity_limit": "Maximum 7 kennels per flight (varies by aircraft)"
    },
    "cargo": {
      "allowed": false,
      "notes": ["Active U.S. Military & State Dept only."]
    },
    "standout_warning": "Highest fee ($150). Strict rule: Carrier replaces your carry-on luggage, not your personal item."
  },
  {
    "id": "southwest",
    "name": "Southwest Airlines",
    "official_url": "https://support.southwest.com/helpcenter/s/article/pet-policy",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/southwest/",
    "cabin": {
      "allowed": true,
      "fee": 125,
      "max_dimensions": "18.5x8.5x13.5 in",
      "weight_limit": "None",
      "notes": [],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Not required for domestic travel",
      "vaccine_requirements": ["No specific requirements for domestic", "Check destination requirements"],
      "breed_restrictions": "None specified",
      "booking_requirements": "First come, first served - cannot reserve in advance",
      "carrier_requirements": "Soft-sided carrier strongly recommended due to low height clearance",
      "quantity_limit": "Maximum 6 pet carriers per flight"
    },
    "cargo": { "allowed": false },
    "standout_warning": "The carrier height limit (8.5\") is very low! Choose a soft carrier that can squish down."
  },
  {
    "id": "united",
    "name": "United Airlines",
    "official_url": "https://www.united.com/en/us/fly/travel/traveling-with-pets.html",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/united_airlines/",
    "cabin": {
      "allowed": true,
      "fee": 125,
      "max_dimensions": "Hard: 17.5x12x7.5 in / Soft: 18x11x11 in",
      "weight_limit": "None",
      "notes": [],
      "age_requirement": "Minimum 4 months old",
      "health_certificate": "Required for all flights",
      "vaccine_requirements": ["Rabies vaccination required", "Must attach rabies tag to carrier"],
      "breed_restrictions": "No American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier, or American Bully",
      "booking_requirements": "Must confirm pet travel at time of booking",
      "carrier_requirements": "Must have room to stand and turn around",
      "quantity_limit": "Varies by aircraft type"
    },
    "cargo": {
      "allowed": false,
      "notes": ["PetSafe program suspended."]
    },
    "standout_warning": "United is strict about breed restrictions even in cabin (No Pit Bulls). Must check-in with agent."
  },
  {
    "id": "jetblue",
    "name": "JetBlue",
    "official_url": "https://www.jetblue.com/traveling-together/traveling-with-pets",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/jetblue/",
    "cabin": {
      "allowed": true,
      "fee": 125,
      "max_dimensions": "17x12.5x8.5 in",
      "weight_limit": "20 lbs (Combined)",
      "notes": [],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Not required for domestic flights",
      "vaccine_requirements": ["Vaccination records recommended", "Required for international destinations"],
      "breed_restrictions": "None specified",
      "booking_requirements": "Must add pet at time of booking or by calling customer service",
      "carrier_requirements": "Soft-sided carrier only, must fit under seat",
      "quantity_limit": "Maximum 4 pets per flight"
    },
    "cargo": { "allowed": false },
    "standout_warning": "Offers 'JetPaws' program rewards. Good legroom generally helps with under-seat carriers."
  },
  {
    "id": "frontier",
    "name": "Frontier Airlines",
    "official_url": "https://faq.flyfrontier.com/help/do-you-allow-pets-on-the-plane",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/frontier/",
    "cabin": {
      "allowed": true,
      "fee": 99,
      "max_dimensions": "18x14x8 in",
      "weight_limit": "None",
      "notes": [],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Not required for domestic travel",
      "vaccine_requirements": ["No specific requirements", "Bring vaccination records"],
      "breed_restrictions": "None specified",
      "booking_requirements": "Can be added during booking or up to departure",
      "carrier_requirements": "Bring your own water dish - no amenities provided",
      "quantity_limit": "Limited availability per flight"
    },
    "cargo": { "allowed": false },
    "standout_warning": "Cheap ($99), but NO services. Bring your own water bowl. Very strict on bag sizing."
  },
  {
    "id": "spirit",
    "name": "Spirit Airlines",
    "official_url": "https://customersupport.spirit.com/en-us/category/article/KA-01181",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/spirit/",
    "cabin": {
      "allowed": true,
      "fee": 125,
      "max_dimensions": "18x14x9 in",
      "weight_limit": "40 lbs (Combined)",
      "notes": ["Domestic flights only."],
      "age_requirement": "Minimum 8 weeks old",
      "health_certificate": "Not required",
      "vaccine_requirements": ["No specific requirements for domestic", "Vaccination records recommended"],
      "breed_restrictions": "None specified",
      "booking_requirements": "Must purchase in advance online or at airport",
      "carrier_requirements": "Despite 40lb limit, carrier must fit in 9\" space",
      "quantity_limit": "Maximum 4 pet carriers per flight"
    },
    "cargo": { "allowed": false },
    "standout_warning": "DECEPTIVE LIMIT: They allow 40 lbs (huge!), BUT the under-seat height is only 9\". A 40lb dog physically cannot fit in a 9\" high bag."
  }
];

export const TransitPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch pets with real-time data on component focus
  const { data: pets, isLoading, error, refetch } = useQuery({
    queryKey: ["transit-pets", user?.user_id],
    queryFn: () => api.getUserPets(user!.user_id),
    enabled: !!user,
  });

  // Refetch pets when component mounts (to ensure fresh data)
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // Get selected pet object
  const selectedPet = useMemo(() => {
    if (!selectedPetId || !pets) return null;
    return pets.find((pet: Pet) => pet.pet_id === selectedPetId);
  }, [selectedPetId, pets]);

  // Helper function to convert kg to lbs
  const kgToLbs = (kg: number) => kg * 2.20462;

  // Helper function to parse pet weight from size string (e.g., "25 kg" or "55 lbs")
  const parsePetWeight = (size: string | undefined): number | null => {
    if (!size) return null;
    const kgMatch = size.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (kgMatch) {
      return kgToLbs(parseFloat(kgMatch[1]));
    }
    const lbsMatch = size.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/i);
    if (lbsMatch) {
      return parseFloat(lbsMatch[1]);
    }
    return null;
  };

  // Helper function to calculate age in weeks from date_of_birth
  const calculateAgeFromDOB = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    try {
      const dob = new Date(dateOfBirth);
      const now = new Date();
      const diffTime = now.getTime() - dob.getTime();
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks >= 0 ? diffWeeks : null;
    } catch {
      return null;
    }
  };

  // Helper function to parse pet age from age string (e.g., "2 years 3 months")
  const parsePetAgeInWeeks = (ageString: string | undefined): number | null => {
    if (!ageString) return null;
    let totalWeeks = 0;
    const yearsMatch = ageString.match(/(\d+)\s*years?/i);
    const monthsMatch = ageString.match(/(\d+)\s*months?/i);
    const weeksMatch = ageString.match(/(\d+)\s*weeks?/i);
    
    if (yearsMatch) totalWeeks += parseInt(yearsMatch[1]) * 52;
    if (monthsMatch) totalWeeks += Math.round(parseInt(monthsMatch[1]) * 4.33);
    if (weeksMatch) totalWeeks += parseInt(weeksMatch[1]);
    
    // Return null if no matches found, otherwise return total weeks (even if 0)
    if (!yearsMatch && !monthsMatch && !weeksMatch) return null;
    return totalWeeks;
  };

  // Helper function to parse weight limit string (e.g., "20 lbs" -> 20)
  const parseWeightLimit = (weightLimit: string): number | null => {
    if (!weightLimit || weightLimit.toLowerCase().includes('none')) return null;
    const match = weightLimit.match(/(\d+)\s*lbs/i);
    return match ? parseInt(match[1]) : null;
  };

  // Helper function to check if breed is restricted
  const isBreedRestricted = (breedRestrictions: string, petBreed: string): boolean => {
    if (!breedRestrictions || breedRestrictions === "None" || breedRestrictions === "None specified") {
      return false;
    }
    
    const restrictionLower = breedRestrictions.toLowerCase();
    const breedLower = petBreed.toLowerCase();
    
    // Check for brachycephalic/short-nosed breeds
    if (restrictionLower.includes('brachycephalic') || restrictionLower.includes('short-nosed') || restrictionLower.includes('snub-nosed')) {
      const brachycephalicBreeds = ['husky', 'bulldog', 'pug', 'boxer', 'shih tzu', 'boston terrier', 'pekingese', 'french bulldog'];
      // Husky is NOT a brachycephalic breed
      if (breedLower.includes('husky')) return false;
      return brachycephalicBreeds.some(breed => breedLower.includes(breed));
    }
    
    // Check for pit bull restrictions
    if (restrictionLower.includes('pit bull') || restrictionLower.includes('american staffordshire') || restrictionLower.includes('staffordshire bull')) {
      return breedLower.includes('pit bull') || breedLower.includes('staffordshire') || breedLower.includes('american bully');
    }
    
    return false;
  };

  // Helper function to check if pet meets age requirement
  // Supports both date_of_birth and age string
  const meetsAgeRequirement = (ageRequirement: string, pet: Pet): boolean => {
    if (!ageRequirement) return true; // No requirement = skip check
    
    // Try to get pet age in weeks (priority: date_of_birth > age string)
    let petAgeWeeks: number | null = null;
    if (pet.date_of_birth) {
      petAgeWeeks = calculateAgeFromDOB(pet.date_of_birth);
    } else if (pet.age) {
      petAgeWeeks = parsePetAgeInWeeks(pet.age);
    }
    
    if (petAgeWeeks === null) return true; // If can't determine age, assume OK
    
    // Parse requirement
    const weeksMatch = ageRequirement.match(/(\d+)\s*weeks/i);
    const monthsMatch = ageRequirement.match(/(\d+)\s*months/i);
    
    if (weeksMatch) {
      const requiredWeeks = parseInt(weeksMatch[1]);
      return petAgeWeeks >= requiredWeeks;
    }
    
    if (monthsMatch) {
      const requiredMonths = parseInt(monthsMatch[1]);
      const requiredWeeks = Math.round(requiredMonths * 4.33);
      return petAgeWeeks >= requiredWeeks;
    }
    
    return true; // Can't parse requirement = assume OK
  };

  // Check if pet can use cabin
  const canUseCabin = (provider: any, pet: Pet): boolean => {
    // Check age (pass full pet object to support both date_of_birth and age string)
    if (provider.cabin.age_requirement && !meetsAgeRequirement(provider.cabin.age_requirement, pet)) {
      return false;
    }
    
    // Check breed restrictions
    if (provider.cabin.breed_restrictions && pet.breed && isBreedRestricted(provider.cabin.breed_restrictions, pet.breed)) {
      return false;
    }
    
    // Check weight
    const weightLimit = parseWeightLimit(provider.cabin.weight_limit);
    if (weightLimit) {
      const petWeightLbs = parsePetWeight(pet.size);
      if (petWeightLbs && petWeightLbs > weightLimit) {
        return false;
      }
    }
    
    return true;
  };

  // Check if pet can use cargo
  const canUseCargo = (provider: any, pet: Pet): boolean => {
    if (!provider.cargo?.allowed) return false;
    
    // Check breed restrictions
    if (provider.cargo.restrictions && pet.breed && isBreedRestricted(provider.cargo.restrictions, pet.breed)) {
      return false;
    }
    
    // Check weight
    if (provider.cargo.weight_limit) {
      const weightLimit = parseWeightLimit(provider.cargo.weight_limit);
      if (weightLimit) {
        const petWeightLbs = parsePetWeight(pet.size);
        if (petWeightLbs && petWeightLbs > weightLimit) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Filter and categorize providers
  const filteredProviders = useMemo(() => {
    // First apply search filter
    let providers = TRANSIT_DATA;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      providers = providers.filter(provider => 
        provider.name.toLowerCase().includes(query)
      );
    }

    // Then apply pet-based filter
    if (!selectedPet) {
      return providers.map(provider => ({
        ...provider,
        cabinAvailable: true,
        cargoAvailable: provider.cargo?.allowed || false,
        visible: true
      }));
    }

    return providers.map(provider => {
      const cabinOk = canUseCabin(provider, selectedPet);
      const cargoOk = canUseCargo(provider, selectedPet);
      
      return {
        ...provider,
        cabinAvailable: cabinOk,
        cargoAvailable: cargoOk,
        visible: cabinOk || cargoOk // Only show if at least one option is available
      };
    }).filter(p => p.visible);
  }, [selectedPet, searchQuery]);

  const handlePetToggle = (petId: number) => {
    // Single selection logic: toggle on/off
    setSelectedPetId(prev => prev === petId ? null : petId);
  };

  const handleBackClick = () => {
    navigate('/explore');
  };

  const handleProviderClick = (providerId: string) => {
    const provider = TRANSIT_DATA.find(p => p.id === providerId);
    if (provider) {
      navigate(`/transit/${providerId}`, { state: { provider } });
    }
  };

  const getCargoPill = (provider: any) => {
    if (provider.cargo?.allowed) {
      return `: $${provider.cargo.fee}`;
    } else {
      return "";
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-gray-200 safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Transit</h1>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search airlines or trains..."
            className="pl-12 h-12 bg-card border-border rounded-2xl shadow-sm text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>
      </div>

      {/* Pet Filter Section */}
      {isLoading ? (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading pets...</span>
          </div>
        </div>
      ) : pets && pets.length > 0 ? (
        <div className="px-4 py-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">Filter by Pet</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {pets.map((pet: Pet, index: number) => (
                <motion.button
                  key={pet.pet_id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handlePetToggle(pet.pet_id!)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    selectedPetId === pet.pet_id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-card hover:border-green-300'
                  }`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={pet.avatar_url} alt={pet.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {pet.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground">
                    {pet.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Filter Result Count */}
      {(selectedPet || searchQuery.trim()) && (
        <div className="px-4 py-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              {selectedPet && searchQuery.trim() 
                ? `Showing ${filteredProviders.length} ${filteredProviders.length === 1 ? 'option' : 'options'} matching "${searchQuery}" suitable for ${selectedPet.name}`
                : selectedPet
                ? `Showing ${filteredProviders.length} ${filteredProviders.length === 1 ? 'option' : 'options'} suitable for ${selectedPet.name}`
                : `Found ${filteredProviders.length} ${filteredProviders.length === 1 ? 'result' : 'results'} for "${searchQuery}"`
              }
            </span>
          </motion.div>
        </div>
      )}

      {/* Provider List */}
      <div className="px-4">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-foreground mb-4"
        >
          Airlines & Transportation
        </motion.h2>

        {filteredProviders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-6 bg-amber-50 border border-amber-200 rounded-2xl"
          >
            <AlertCircle className="w-12 h-12 text-amber-600 mb-4" />
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {searchQuery.trim() ? 'No Results Found' : 'No Suitable Options Found'}
            </h3>
            <p className="text-sm text-amber-800 text-center">
              {searchQuery.trim() 
                ? `No airlines match "${searchQuery}". Try a different search term.`
                : selectedPet
                ? `No airlines match ${selectedPet.name}'s criteria directly. Please check specialized pet transport services or contact airlines for special arrangements.`
                : 'No transit options available.'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredProviders.map((provider, index) => {
              const IconComponent = provider.id === 'amtrak' ? Train : Plane;
              // Try to load logo image, fallback to icon
              let logoSrc = '';
              try {
                logoSrc = new URL(`../assets/logos/${provider.id === 'american' ? 'aa' : provider.id}.png`, import.meta.url).href;
              } catch {
                // Logo file not found, will use icon fallback
              }
              
              return (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleProviderClick(provider.id)}
                  className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-sm hover:bg-green-50/30 transition-all cursor-pointer"
                >
                {/* Logo or Icon */}
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-gray-200 overflow-hidden">
                  {logoSrc ? (
                    <img 
                      src={logoSrc} 
                      alt={`${provider.name} logo`} 
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        // If image fails to load, show icon instead
                        e.currentTarget.style.display = 'none';
                        const iconEl = e.currentTarget.nextElementSibling as HTMLElement;
                        if (iconEl) iconEl.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <IconComponent 
                    className="w-7 h-7 text-gray-400" 
                    style={{ display: logoSrc ? 'none' : 'block' }}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-base text-foreground mb-1">
                        {provider.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        {provider.id === 'amtrak' ? 'Train' : 'Airline'}
                      </Badge>
                    </div>
                    {/* Pills - Vertical Layout */}
                    <div className="flex flex-col gap-1.5">
                      <div className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap min-w-[110px] text-center ${
                        provider.cabinAvailable 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        In-Cabin: ${provider.cabin.fee}
                      </div>
                      <div className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap min-w-[110px] text-center ${
                        provider.cargoAvailable 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                          : 'bg-gray-200 text-gray-500 border border-gray-300'
                      }`}>
                        Cargo{getCargoPill(provider)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};