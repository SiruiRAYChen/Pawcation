import { motion } from "framer-motion";
import { Edit2, Syringe, Microchip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PawIcon } from "@/components/icons/PawIcon";

interface PetCardProps {
  name: string;
  breed: string;
  weight: string;
  image: string;
  personality?: string[];
  rabiesExp?: string;
  microchipId?: string;
  onEdit?: () => void;
}

export const PetCard = ({
  name,
  breed,
  weight,
  image,
  personality = [],
  rabiesExp,
  microchipId,
  onEdit,
}: PetCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-2xl shadow-paw overflow-hidden border border-border"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-card">{name}</h3>
          <p className="text-card/80 font-medium">{breed}</p>
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
            {weight}
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

        <div className="pt-2 border-t border-border space-y-2">
          {rabiesExp && (
            <div className="flex items-center gap-2 text-sm">
              <Syringe className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">Rabies:</span>
              <span className="font-medium">{rabiesExp}</span>
            </div>
          )}
          {microchipId && (
            <div className="flex items-center gap-2 text-sm">
              <Microchip className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Chip:</span>
              <span className="font-mono text-xs">{microchipId}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
