import { motion } from "framer-motion";
import { Edit2, Syringe, Microchip, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PawIcon } from "@/components/icons/PawIcon";
import { Pet } from "@/lib/api";
import sampleCorgi from "@/assets/sample-pet-corgi.png";

interface PetCardProps {
  pet: Pet;
  onEdit?: () => void;
}

export const PetCard = ({ pet, onEdit }: PetCardProps) => {
  const {
    name,
    breed,
    size,
    avatar_url,
    image_url,
    personality = [],
    rabies_expiration,
    microchip_id,
    health,
    age,
  } = pet;

  // Use avatar_url if available, fallback to image_url, then to default
  const displayImage = avatar_url || image_url || sampleCorgi;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg overflow-hidden border-2 border-green-200/60"
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawIcon className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">PET LICENSE</span>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex items-start gap-4">
        {/* Left: Circular Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg">
            <img
              src={displayImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right: Pet Information */}
        <div className="flex-1 space-y-1">
          {/* Name */}
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{name}</h3>
          
          {/* Basic Info */}
          <div className="space-y-0.5">
            <div className="text-sm">
              <span className="text-gray-600 font-medium">BREED:</span>
              <span className="ml-2 text-gray-900">{breed || 'Unknown'}</span>
            </div>
            {age && (
              <div className="text-sm">
                <span className="text-gray-600 font-medium">AGE:</span>
                <span className="ml-2 text-gray-900">{age}</span>
              </div>
            )}
            {size && (
              <div className="text-sm">
                <span className="text-gray-600 font-medium">SIZE:</span>
                <span className="ml-2 text-gray-900">{size}</span>
              </div>
            )}
          </div>

          {/* Personality Badges */}
          {personality.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {personality.slice(0, 3).map((trait) => (
                <Badge 
                  key={trait} 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5 bg-green-100 text-green-800"
                >
                  {trait}
                </Badge>
              ))}
              {personality.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700">
                  +{personality.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="px-4 pb-3 pt-1 border-t border-green-200/50">
        <div className="grid grid-cols-2 gap-3 text-xs">
          {rabies_expiration && (
            <div className="flex items-center gap-1.5">
              <Syringe className="w-3.5 h-3.5 text-green-600" />
              <div>
                <div className="text-gray-600 font-medium">RABIES EXP</div>
                <div className="text-gray-900">{new Date(rabies_expiration).toLocaleDateString()}</div>
              </div>
            </div>
          )}
          {microchip_id && (
            <div className="flex items-center gap-1.5">
              <Microchip className="w-3.5 h-3.5 text-emerald-600" />
              <div>
                <div className="text-gray-600 font-medium">CHIP ID</div>
                <div className="text-gray-900 font-mono text-xs">{microchip_id}</div>
              </div>
            </div>
          )}
          {health && (
            <div className="col-span-2 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-green-600" />
              <div>
                <span className="text-gray-600 font-medium text-xs">HEALTH: </span>
                <span className="text-gray-900 text-xs">{health}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
