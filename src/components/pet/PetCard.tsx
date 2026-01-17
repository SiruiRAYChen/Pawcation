import { motion } from "framer-motion";
import { Edit2, Syringe, Microchip, HeartPulse, Paintbrush } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PawIcon } from "@/components/icons/PawIcon";
import { Pet } from "@/lib/api";
import sampleCorgi from "@/assets/sample-pet-corgi.png"; // Default image

interface PetCardProps {
  pet: Pet;
  onEdit?: () => void;
}

export const PetCard = ({ pet, onEdit }: PetCardProps) => {
  const {
    name,
    breed,
    size,
    image_url,
    personality = [],
    rabies_expiration,
    microchip_id,
    health,
    appearance,
    age,
  } = pet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-2xl shadow-paw overflow-hidden border border-border"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image_url || sampleCorgi}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-card">{name}</h3>
          <p className="text-card/80 font-medium">{breed} {age && `(${age})`}</p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-3 right-3 p-2 bg-card/90 backdrop-blur-sm rounded-full shadow-md hover:bg-card transition-colors"
          >
            <Edit2 className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PawIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {size}
          </span>
        </div>

        {personality.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {personality.map((trait) => (
              <Badge key={trait} variant="secondary" className="rounded-full">
                {trait}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="space-y-2 text-sm">
          {health && (
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">{health}</span>
            </div>
          )}
          {appearance && (
            <div className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-purple-500" />
              <span className="text-muted-foreground">{appearance}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border space-y-2">
          {rabies_expiration && (
            <div className="flex items-center gap-2 text-sm">
              <Syringe className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">Rabies Exp:</span>
              <span className="font-medium">{new Date(rabies_expiration).toLocaleDateString()}</span>
            </div>
          )}
          {microchip_id && (
            <div className="flex items-center gap-2 text-sm">
              <Microchip className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Chip ID:</span>
              <span className="font-mono text-xs">{microchip_id}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
