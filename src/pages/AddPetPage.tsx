import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Pet } from '../lib/api';

const AddPetPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({ title: 'You must be logged in to add a pet.', variant: 'destructive' });
      return;
    }
    try {
      await api.createPet({ ...petData, user_id: auth.user.user_id } as Pet);
      toast({ title: 'Pet added successfully!' });
      navigate('/profile');
    } catch (error) {
      toast({ title: 'Failed to add pet.', description: String(error), variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a New Pet</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pet-image">Pet's Photo</Label>
              <Input id="pet-image" type="file" onChange={handleImageChange} accept="image/*" />
              {previewImage && <img src={previewImage} alt="Pet preview" className="mt-2 h-48 w-auto object-cover rounded-md" />}
            </div>
            <Button type="button" onClick={handleAnalyzeImage} disabled={isAnalyzing || !imageFile}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Photo with AI'}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={petData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" name="breed" value={petData.breed} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" value={petData.age} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size (e.g., Medium, 15-20kg)</Label>
                <Input id="size" name="size" value={petData.size} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health">Health Condition</Label>
                <Input id="health" name="health" value={petData.health} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appearance">Appearance</Label>
                <Input id="appearance" name="appearance" value={petData.appearance} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personality">Personality (comma-separated)</Label>
                <Input id="personality" name="personality" value={petData.personality?.join(', ')} onChange={handlePersonalityChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rabies_expiration">Rabies Vaccination Expiration</Label>
                <Input id="rabies_expiration" name="rabies_expiration" type="date" value={petData.rabies_expiration} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microchip_id">Microchip ID</Label>
                <Input id="microchip_id" name="microchip_id" value={petData.microchip_id} onChange={handleChange} />
              </div>
            </div>

            <Button type="submit" className="w-full">Save Pet</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPetPage;
