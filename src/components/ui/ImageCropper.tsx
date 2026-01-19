import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, X } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  size: number;
}

export function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, size: 200 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - cropArea.size / 2;
    const y = e.clientY - rect.top - cropArea.size / 2;

    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, rect.width - prev.size)),
      y: Math.max(0, Math.min(y, rect.height - prev.size))
    }));
  }, [isDragging, cropArea.size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    // Set canvas size to crop area
    canvas.width = cropArea.size * scaleX;
    canvas.height = cropArea.size * scaleY;

    // Draw cropped image
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.size * scaleX,
      cropArea.size * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(croppedUrl);
      }
    }, 'image/jpeg', 0.9);
  }, [cropArea, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-center">Crop Pet Photo</h3>
        
        <div className="relative mb-4">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop preview"
            className="w-full h-80 object-contain"
            onLoad={() => setImageLoaded(true)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {imageLoaded && (
            <div
              className="absolute border-4 border-green-500 bg-green-500/10 rounded-full cursor-move"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.size,
                height: cropArea.size,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="w-full h-full border-2 border-white rounded-full" />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Crop Size</label>
          <input
            type="range"
            min="100"
            max="300"
            value={cropArea.size}
            onChange={(e) => setCropArea(prev => ({ ...prev, size: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCropConfirm} className="flex-1 bg-green-600 hover:bg-green-700">
            <Check className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}