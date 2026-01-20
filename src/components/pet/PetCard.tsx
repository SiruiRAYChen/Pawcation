import { motion } from "framer-motion";
import { Edit2, Syringe, Microchip, HeartPulse, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PawIcon } from "@/components/icons/PawIcon";
import { Pet, api } from "@/lib/api";
import sampleCorgi from "@/assets/sample-pet-corgi.png";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PetCardProps {
  pet: Pet;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PetCard = ({ pet, onEdit, onDelete }: PetCardProps) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

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
    pet_id,
  } = pet;

  // Use avatar_url if available, fallback to image_url, then to default
  const displayImage = avatar_url || image_url || sampleCorgi;

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX.current;
    
    // Only allow left swipe (negative values)
    if (deltaX <= 0) {
      setDragOffset(Math.max(deltaX, -100));
    } else {
      setDragOffset(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Snap to position based on drag distance
    if (dragOffset < -40) {
      setDragOffset(-100); // Show delete button
    } else {
      setDragOffset(0); // Hide delete button
    }
  };

  const handleDelete = async () => {
    if (!pet_id) return;
    
    setIsDeleting(true);
    try {
      await api.deletePet(pet_id);
      toast({
        title: "Success",
        description: `${name}'s license has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pet license.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete button when clicking on the card (only if not dragging)
  const handleCardClick = (e: React.MouseEvent) => {
    // Only close if we're not in the middle of a drag operation
    if (!isDragging && dragOffset < 0) {
      setDragOffset(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Delete Button Background (Hidden behind the card) */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-red-500 flex items-center justify-center rounded-r-xl">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex flex-col items-center justify-center gap-1 text-white hover:bg-red-600 transition-colors p-4 w-full h-full rounded-r-xl disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-xs font-bold">DELETE</span>
        </button>
      </div>

      {/* Swipeable Pet Card */}
      <motion.div
        animate={{ x: dragOffset }}
        transition={{ type: "spring", damping: 20, mass: 0.5 }}
        className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200/60 touch-pan-y select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleCardClick}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
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
    </motion.div>
  );
};
