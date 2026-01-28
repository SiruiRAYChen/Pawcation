import { PawIcon } from "@/components/icons/PawIcon";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api, Pet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Loader2, ArrowLeft, Plane, Train } from "lucide-react";
import { useState, useEffect } from "react";
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
      "notes": ["Dogs, cats, rabbits, and household birds allowed."]
    },
    "cargo": {
      "allowed": true,
      "fee": 150,
      "weight_limit": "150 lbs (Pet + Carrier)",
      "restrictions": "No Brachycephalic (short-nosed) dogs."
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
      "weight_limit": "20 lbs (Strict, Combined)",
      "notes": ["Max trip duration: 7 hours."]
    },
    "cargo": { "allowed": false },
    "standout_warning": "Strict 20 lbs limit including carrier. They WILL weigh it. Only for trips under 7 hours."
  },
  {
    "id": "delta",
    "name": "Delta Air Lines",
    "official_url": "https://www.delta.com/us/en/pet-travel/overview",
    "bringfido_url": "https://www.bringfido.com/travel/airline_policies/delta/",
    "cabin": {
      "allowed": true,
      "fee": 95,
      "max_dimensions": "Varies by aircraft (Rec: 18x11x11 in)",
      "weight_limit": "None",
      "notes": ["First come, first served."]
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
      "notes": ["Pet carrier replaces your carry-on bag."]
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
      "notes": ["Limit 6 pets per flight."]
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
      "notes": ["No pit bull breeds allowed."]
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
      "notes": ["Earn 300 TrueBlue points per flight."]
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
      "notes": ["No food/water provided."]
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
      "weight_limit": "40 lbs (Combined - Highest in industry!)",
      "notes": ["Domestic flights only. Birds and rabbits are also allowed."]
    },
    "cargo": { "allowed": false },
    "standout_warning": "DECEPTIVE LIMIT: They allow 40 lbs (huge!), BUT the under-seat height is only 9\". A 40lb dog physically cannot fit in a 9\" high bag."
  }
];

export const TransitPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);

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

  const handlePetToggle = (petId: number) => {
    setSelectedPetIds(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
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
                    selectedPetIds.includes(pet.pet_id!)
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

        <div className="space-y-3">
          {TRANSIT_DATA.map((provider, index) => {
            const IconComponent = provider.id === 'amtrak' ? Train : Plane;
            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleProviderClick(provider.id)}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-sm hover:bg-green-50/30 transition-all cursor-pointer"
              >
                {/* Logo placeholder */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center border border-green-300">
                  <IconComponent className="w-7 h-7 text-green-600" />
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
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-300 whitespace-nowrap w-24 text-center">
                        In-Cabin: ${provider.cabin.fee}
                      </div>
                      <div className={`px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap w-24 text-center ${
                        provider.cargo?.allowed 
                          ? 'bg-green-100 text-green-700 border-green-300' 
                          : 'bg-gray-100 text-gray-500 border-gray-300'
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
      </div>
    </div>
  );
};