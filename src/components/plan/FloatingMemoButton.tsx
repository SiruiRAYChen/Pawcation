import { motion, PanInfo } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface FloatingMemoButtonProps {
  onClick: () => void;
}

export function FloatingMemoButton({ onClick }: FloatingMemoButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartTime = useRef<number>(0);

  // Initialize position on mount (bottom-right corner)
  useEffect(() => {
    const updatePosition = () => {
      const margin = 20;
      const buttonSize = 56;
      setPosition({
        x: window.innerWidth - buttonSize - margin,
        y: window.innerHeight - buttonSize - margin - 80, // Account for bottom nav
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleDragStart = () => {
    dragStartTime.current = Date.now();
    setIsDragging(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDuration = Date.now() - dragStartTime.current;
    setIsDragging(false);

    // If drag was very short (< 200ms) and minimal movement, treat as click
    const totalMovement = Math.abs(info.offset.x) + Math.abs(info.offset.y);
    if (dragDuration < 200 && totalMovement < 10) {
      onClick();
      return;
    }

    // Snap to nearest edge
    const buttonSize = 56;
    const margin = 20;
    const newX = position.x + info.offset.x;
    const newY = position.y + info.offset.y;

    // Calculate distances to edges
    const leftDistance = newX;
    const rightDistance = window.innerWidth - newX - buttonSize;
    const topDistance = newY;
    const bottomDistance = window.innerHeight - newY - buttonSize - 80; // Account for bottom nav

    // Find closest edge
    const minHorizontal = Math.min(leftDistance, rightDistance);
    const minVertical = Math.min(topDistance, bottomDistance);

    let snapX = newX;
    let snapY = newY;

    // Snap to horizontal edge if it's closer
    if (minHorizontal < minVertical) {
      snapX = leftDistance < rightDistance ? margin : window.innerWidth - buttonSize - margin;
      snapY = Math.max(margin, Math.min(newY, window.innerHeight - buttonSize - margin - 80));
    } else {
      // Snap to vertical edge
      snapY = topDistance < bottomDistance ? margin : window.innerHeight - buttonSize - margin - 80;
      snapX = Math.max(margin, Math.min(newX, window.innerWidth - buttonSize - margin));
    }

    setPosition({ x: snapX, y: snapY });
  };

  return (
    <motion.div
      ref={buttonRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={position}
      style={{
        position: 'fixed',
        zIndex: 50,
        touchAction: 'none',
      }}
      className="cursor-move"
    >
      <motion.button
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            onClick();
          }
        }}
        whileHover={{ scale: isDragging ? 1 : 1.1 }}
        whileTap={{ scale: isDragging ? 1 : 0.95 }}
        className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Open packing memo"
      >
        <ClipboardList className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}
