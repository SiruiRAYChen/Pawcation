import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Camera, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetCard } from "@/components/pet/PetCard";
import { PawIcon } from "@/components/icons/PawIcon";
import sampleCorgi from "@/assets/sample-pet-corgi.png";
import sampleCat from "@/assets/sample-pet-cat.png";

interface Pet {
  id: string;
  name: string;
  breed: string;
  weight: string;
  image: string;
  personality: string[];
  rabiesExp?: string;
  microchipId?: string;
}

const samplePets: Pet[] = [
  {
    id: "1",
    name: "Buddy",
    breed: "Pembroke Welsh Corgi",
    weight: "28 lbs (Medium)",
    image: sampleCorgi,
    personality: ["Energetic Explorer", "Treat Lover"],
    rabiesExp: "Dec 2025",
    microchipId: "985112345678901",
  },
  {
    id: "2",
    name: "Whiskers",
    breed: "Orange Tabby Cat",
    weight: "11 lbs (Small)",
    image: sampleCat,
    personality: ["Couch Potato", "Curious"],
    rabiesExp: "Mar 2025",
  },
];

export const ProfileTab = () => {
  const [pets, setPets] = useState<Pet[]>(samplePets);
  const [showAddPet, setShowAddPet] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddPetClick = () => {
    setShowAddPet(true);
  };

  const handlePhotoUpload = () => {
    // Simulate AI analysis
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowAddPet(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen pb-24 gradient-hero">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <PawIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">My Pets</h1>
          </div>
          <Button
            onClick={handleAddPetClick}
            size="sm"
            className="gradient-primary rounded-full shadow-glow"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Pet
          </Button>
        </motion.div>
        <p className="text-muted-foreground mt-1">
          Your travel companions
        </p>
      </div>

      {/* Pet Cards */}
      <div className="px-4 space-y-4">
        {pets.map((pet, index) => (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PetCard
              name={pet.name}
              breed={pet.breed}
              weight={pet.weight}
              image={pet.image}
              personality={pet.personality}
              rabiesExp={pet.rabiesExp}
              microchipId={pet.microchipId}
              onEdit={() => {}}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {pets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mt-8 p-8 bg-card rounded-2xl border border-dashed border-primary/30 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <PawIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-foreground mb-2">No pets yet!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your furry friend to start planning pet-approved trips
          </p>
          <Button onClick={handleAddPetClick} className="gradient-primary rounded-full">
            <Camera className="w-4 h-4 mr-2" />
            Snap a Photo
          </Button>
        </motion.div>
      )}

      {/* Add Pet Modal */}
      <AnimatePresence>
        {showAddPet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => !isAnalyzing && setShowAddPet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 safe-bottom"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Add New Pet</h2>
                {!isAnalyzing && (
                  <button
                    onClick={() => setShowAddPet(false)}
                    className="p-2 hover:bg-muted rounded-full"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {!isAnalyzing ? (
                <div className="space-y-4">
                  <button
                    onClick={handlePhotoUpload}
                    className="w-full h-40 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">Upload a Photo</p>
                      <p className="text-sm text-muted-foreground">
                        Our AI will identify breed & size
                      </p>
                    </div>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-sm text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Input
                    placeholder="Enter pet's name manually"
                    className="h-12 bg-muted/50 rounded-xl"
                  />
                </div>
              ) : (
                <div className="py-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 mx-auto mb-4"
                  >
                    <PawIcon className="w-full h-full text-primary" />
                  </motion.div>
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <Sparkles className="w-5 h-5" />
                    <span>AI is analyzing your pet...</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Identifying breed, size, and personality
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
