import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Pet } from '../lib/api';

const AddPetPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { petId } = useParams<{ petId?: string }>();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load pet data if in edit mode
  useEffect(() => {
    if (petId) {
      setIsEditMode(true);
      loadPetData();
    }
  }, [petId]);

  const loadPetData = async () => {
    if (!petId) return;
    
    setIsLoading(true);
    try {
      const pet = await api.getPet(parseInt(petId));
      // Format date for input field (YYYY-MM-DD)
      const formattedPet = {
        ...pet,
        rabies_expiration: pet.rabies_expiration ? 
          new Date(pet.rabies_expiration).toISOString().split('T')[0] : 
          ''
      };
      setPetData(formattedPet);
      if (pet.avatar_url || pet.image_url) {
        setPreviewImage(pet.avatar_url || pet.image_url);
      }
    } catch (error) {
      toast({ 
        title: 'Failed to load pet data', 
        description: String(error), 
        variant: 'destructive' 
      });
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast({ title: 'Please select an image first.', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysis = await api.analyzePetImage(imageFile);
      setPetData(prev => ({
        ...prev,
        ...analysis,
        // The personality from Gemini might be an array of strings
        personality: Array.isArray(analysis.personality) ? analysis.personality : (analysis.personality ? [analysis.personality] : []),
      }));
      toast({ title: 'Image analysis complete!' });
    } catch (error) {
      toast({ title: 'Image analysis failed.', description: String(error), variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPetData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePersonalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPetData(prev => ({ ...prev, personality: value.split(',').map(p => p.trim()) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.user) {
      toast({ title: 'You must be logged in to save a pet.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isEditMode && petId) {
        // Update existing pet
        await api.updatePet(parseInt(petId), { ...petData, user_id: auth.user.user_id } as Pet);
        toast({ title: 'Pet updated successfully!' });
      } else {
        // Create new pet
        await api.createPet({ ...petData, user_id: auth.user.user_id } as Pet);
        toast({ title: 'Pet added successfully!' });
      }
      navigate('/profile');
    } catch (error) {
      toast({ 
        title: isEditMode ? 'Failed to update pet.' : 'Failed to add pet.', 
        description: String(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="pt-6">
          {isLoading && isEditMode ? (
            <div className="text-center py-8">Loading pet data...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pet-image">Pet's Photo</Label>
              <Input id="pet-image" type="file" onChange={handleImageChange} accept="image/*" />
              {previewImage && <img src={previewImage} alt="Pet preview" className="mt-2 h-48 w-auto object-cover rounded-md" />}
            </div>
            {!isEditMode && (
              <Button type="button" onClick={handleAnalyzeImage} disabled={isAnalyzing || !imageFile}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze Photo with AI'}
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={petData.name} onChange={handleChange} placeholder="Pet's name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" name="breed" value={petData.breed} onChange={handleChange} placeholder="e.g., Golden Retriever" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" value={petData.age} onChange={handleChange} placeholder="e.g., 2 years" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" name="size" value={petData.size} onChange={handleChange} placeholder="e.g., Medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health">Health Condition</Label>
                <Input id="health" name="health" value={petData.health} onChange={handleChange} placeholder="General health status" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appearance">Appearance</Label>
                <Input id="appearance" name="appearance" value={petData.appearance} onChange={handleChange} placeholder="Physical description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personality">Personality (comma-separated)</Label>
                <Input id="personality" name="personality" value={petData.personality?.join(', ')} onChange={handlePersonalityChange} placeholder="Friendly, playful, calm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rabies_expiration">Rabies Exp.</Label>
                <Input id="rabies_expiration" name="rabies_expiration" type="date" value={petData.rabies_expiration} onChange={handleChange} placeholder="mm/dd/yyyy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microchip_id">Microchip ID</Label>
                <Input id="microchip_id" name="microchip_id" value={petData.microchip_id} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditMode ? 'Update Pet' : 'Add Pet')}
            </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPetPage;
