import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cropSize, setCropSize] = useState(150);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const containerWidth = 300;
      const containerHeight = 300;
      
      // Calculate scaled dimensions to fit container
      const scale = Math.min(containerWidth / img.width, containerHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      overlayCanvas.width = scaledWidth;
      overlayCanvas.height = scaledHeight;
      
      setImageDimensions({ width: scaledWidth, height: scaledHeight });
      setCropPosition({ 
        x: scaledWidth / 2, 
        y: scaledHeight / 2 
      });
      
      setImageLoaded(true);
      drawCanvas(ctx, img, scaledWidth, scaledHeight);
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      drawOverlay();
    }
  }, [cropPosition, cropSize, imageLoaded, imageDimensions]);

  const drawCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  };

  const drawOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, imageDimensions.width, imageDimensions.height);
    
    // Create overlay only within image bounds
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, imageDimensions.width, imageDimensions.height);
    
    // Clear circle area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cropPosition.x, cropPosition.y, cropSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw circle border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cropPosition.x, cropPosition.y, cropSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within crop circle
    const distance = Math.sqrt(
      Math.pow(x - cropPosition.x, 2) + Math.pow(y - cropPosition.y, 2)
    );
    
    if (distance <= cropSize / 2) {
      setIsDragging(true);
      setDragStart({ x: x - cropPosition.x, y: y - cropPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let newX = x - dragStart.x;
    let newY = y - dragStart.y;
    
    // Constrain to image bounds
    const radius = cropSize / 2;
    newX = Math.max(radius, Math.min(imageDimensions.width - radius, newX));
    newY = Math.max(radius, Math.min(imageDimensions.height - radius, newY));
    
    setCropPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setCropSize(newSize);
    
    // Adjust position if needed to stay within bounds
    const radius = newSize / 2;
    let newX = cropPosition.x;
    let newY = cropPosition.y;
    
    newX = Math.max(radius, Math.min(imageDimensions.width - radius, newX));
    newY = Math.max(radius, Math.min(imageDimensions.height - radius, newY));
    
    setCropPosition({ x: newX, y: newY });
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    outputCanvas.width = cropSize;
    outputCanvas.height = cropSize;

    // Draw the cropped circular image
    outputCtx.beginPath();
    outputCtx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    outputCtx.clip();

    outputCtx.drawImage(
      canvas,
      cropPosition.x - cropSize / 2,
      cropPosition.y - cropSize / 2,
      cropSize,
      cropSize,
      0,
      0,
      cropSize,
      cropSize
    );

    const croppedImageUrl = outputCanvas.toDataURL('image/png');
    onCrop(croppedImageUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-center">Crop Pet Photo</h3>
        
        <div className="relative flex justify-center mb-4">
          <div 
            className="relative"
            style={{ width: imageDimensions.width, height: imageDimensions.height }}
          >
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0"
            />
            <canvas 
              ref={overlayCanvasRef}
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Size
          </label>
          <input
            type="range"
            min="80"
            max="250"
            value={cropSize}
            onChange={handleSizeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCrop}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}