import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Upload, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageCropper } from '@/components/pet/ImageCropper';
import { useAuth } from '@/contexts/AuthContext';
import { api, Pet } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetAdded: () => void;
  editingPet?: Pet | null; // 新增：编辑的宠物数据
}

export function AddPetModal({ isOpen, onClose, onPetAdded, editingPet }: AddPetModalProps) {
  const [petData, setPetData] = useState<Partial<Pet>>({
    name: '',
    breed: '',
    age: '',
    size: '',
    personality: [],
    health: '',
    appearance: '',
    rabies_expiration: '',
    microchip_id: '',
    image_url: '',
    avatar_url: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // 当editingPet改变时，预填充数据或重置表单
  useEffect(() => {
    if (editingPet) {
      setIsEditMode(true);
      // 格式化日期
      const formattedData = {
        ...editingPet,
        rabies_expiration: editingPet.rabies_expiration ? 
          new Date(editingPet.rabies_expiration).toISOString().split('T')[0] : 
          ''
      };
      setPetData(formattedData);
      if (editingPet.avatar_url || editingPet.image_url) {
        setPreviewImage(editingPet.avatar_url || editingPet.image_url);
        setCroppedAvatar(editingPet.avatar_url || editingPet.image_url);
      }
    } else {
      setIsEditMode(false);
      setPetData({
        name: '',
        breed: '',
        age: '',
        size: '',
        personality: [],
        health: '',
        appearance: '',
        rabies_expiration: '',
        microchip_id: '',
        image_url: '',
        avatar_url: '',
      });
      setPreviewImage(null);
      setCroppedAvatar(null);
    }
  }, [editingPet, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewImage(result);
        setPetData(prev => ({ ...prev, image_url: result }));
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedAvatar(croppedImageUrl);
    setPetData(prev => ({ ...prev, avatar_url: croppedImageUrl }));
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // Reset image if user cancels cropping
    setPreviewImage(null);
    setImageFile(null);
    setPetData(prev => ({ ...prev, image_url: '', avatar_url: '' }));
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    try {
      const analysis = await api.analyzePetImage(imageFile);
      setPetData(prev => ({
        ...prev,
        ...analysis,
        personality: Array.isArray(analysis.personality) 
          ? analysis.personality 
          : [analysis.personality].filter(Boolean)
      }));
      toast({ title: 'Image analyzed successfully!' });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({ title: 'Failed to analyze image', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please log in first.', variant: 'destructive' });
      return;
    }

    try {
      if (isEditMode && editingPet?.pet_id) {
        // 更新现有宠物
        await api.updatePet(editingPet.pet_id, {
          ...petData,
          user_id: user.user_id,
          personality: Array.isArray(petData.personality) 
            ? petData.personality 
            : petData.personality ? [petData.personality] : []
        } as Pet);
        toast({ title: 'Pet updated successfully!' });
      } else {
        // 创建新宠物
        await api.createPet({
          ...petData,
          user_id: user.user_id,
          personality: Array.isArray(petData.personality) 
            ? petData.personality 
            : petData.personality ? [petData.personality] : []
        } as Pet);
        toast({ title: 'Pet added successfully!' });
      }

      onPetAdded();
      handleClose();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast({ title: isEditMode ? 'Failed to update pet' : 'Failed to add pet', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    setPetData({
      name: '',
      breed: '',
      age: '',
      size: '',
      personality: [],
      health: '',
      appearance: '',
      rabies_expiration: '',
      microchip_id: '',
      image_url: '',
      avatar_url: '',
    });
    setImageFile(null);
    setPreviewImage(null);
    setCroppedAvatar(null);
    setShowCropper(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <motion.div 
        className="relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-w-md max-h-[75vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-6 border-b rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Edit Pet' : 'Add a New Pet'}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-1 h-8 w-8 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pet Photo */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Pet's Photo</Label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="pet-image"
              />
              <label
                htmlFor="pet-image"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                {croppedAvatar ? (
                  <div className="w-full h-full p-2 flex items-center justify-center">
                    <img
                      src={croppedAvatar}
                      alt="Pet avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-green-500"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-gray-500 text-sm">Choose File</span>
                  </div>
                )}
              </label>
            </div>
            
            {croppedAvatar && (
              <Button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm h-9"
              >
                <Camera className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Photo with AI'}
              </Button>
            )}
          </div>

          {/* Form Fields in Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
              <Input
                id="name"
                value={petData.name || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 h-9 text-sm"
                placeholder="Pet's name"
              />
            </div>
            <div>
              <Label htmlFor="breed" className="text-sm font-medium text-gray-700">Breed</Label>
              <Input
                id="breed"
                value={petData.breed || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, breed: e.target.value }))}
                className="mt-1 h-9 text-sm"
                placeholder="e.g., Golden Retriever"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
              <Input
                id="age"
                value={petData.age || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="e.g., 2 years"
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="size" className="text-sm font-medium text-gray-700">Size</Label>
              <Input
                id="size"
                value={petData.size || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, size: e.target.value }))}
                placeholder="e.g., Medium"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="health" className="text-sm font-medium text-gray-700">Health Condition</Label>
            <Textarea
              id="health"
              value={petData.health || ''}
              onChange={(e) => setPetData(prev => ({ ...prev, health: e.target.value }))}
              placeholder="General health status"
              className="mt-1 h-20 text-sm resize-none"
            />
          </div>

          <div>
            <Label htmlFor="appearance" className="text-sm font-medium text-gray-700">Appearance</Label>
            <Textarea
              id="appearance"
              value={petData.appearance || ''}
              onChange={(e) => setPetData(prev => ({ ...prev, appearance: e.target.value }))}
              placeholder="Physical description"
              className="mt-1 h-20 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rabies" className="text-sm font-medium text-gray-700">Rabies Exp.</Label>
              <Input
                id="rabies"
                type="date"
                value={petData.rabies_expiration || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, rabies_expiration: e.target.value }))}
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="microchip" className="text-sm font-medium text-gray-700">Microchip ID</Label>
              <Input
                id="microchip"
                value={petData.microchip_id || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, microchip_id: e.target.value }))}
                className="mt-1 h-9 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="pt-3 pb-6">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-10"
            >
              {isEditMode ? 'Update Pet' : 'Add Pet'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>

    {/* Image Cropper Modal */}
    {showCropper && previewImage && (
      <ImageCropper
        imageUrl={previewImage}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
      />
    )}
    </div>
  );
}