import { analyzeDogImage } from '@/services/geminiService';
import {
    createProfile as createProfileInStorage,
    createUser,
    saveImage
} from '@/services/localStorage';
import type { PetProfileFormData, SignupState } from '@/types/petProfile';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function useSignupFlow() {
  const navigate = useNavigate();
  const [state, setState] = useState<SignupState>({
    step: 1,
    imageFile: null,
    imagePreview: null,
    analysis: null,
    isAnalyzing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setImageFile = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setState(prev => ({
        ...prev,
        imageFile: null,
        imagePreview: null,
      }));
    }
  };

  const analyzeImage = async () => {
    if (!state.imagePreview) {
      toast.error('Please upload an image of your dog first');
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const analysis = await analyzeDogImage(state.imagePreview);

      if (analysis.error) {
        toast.error(analysis.error);
        setState(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        analysis,
        step: 2,
        isAnalyzing: false,
      }));

      toast.success('🐕 Your pup looks great! Let\'s review the details.');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze image. You can still fill in the details manually.');
      // Move to step 2 with empty analysis
      setState(prev => ({
        ...prev,
        analysis: null,
        step: 2,
        isAnalyzing: false,
      }));
    }
  };

  const createProfile = async (
    formData: PetProfileFormData,
    email: string,
    password: string
  ) => {
    setIsSubmitting(true);

    try {
      // Create the user account (stored locally)
      const user = createUser(email, password);

      // Save image to localStorage if we have one
      let imageUrl: string | undefined = undefined;
      if (state.imageFile) {
        imageUrl = await saveImage(state.imageFile);
      }

      // Create pet profile
      createProfileInStorage({
        user_id: user.id,
        name: formData.name,
        breed: formData.breed || undefined,
        age_estimate: formData.age || undefined,
        weight_estimate: formData.weight || undefined,
        weight_unit: formData.weight_unit || 'lbs',
        rabies_vaccinated: formData.rabies_vaccinated || 'unknown',
        separation_anxiety: formData.separation_anxiety || 'unknown',
        flight_comfort: formData.flight_comfort || 'unknown',
        daily_exercise_need: formData.daily_exercise_need || 'unknown',
        environment_preference: formData.environment_preference || 'unknown',
        personality_archetype: formData.personality_archetype || 'unknown',
        image_url: imageUrl,
        gemini_raw_response: state.analysis ? JSON.parse(JSON.stringify(state.analysis)) : undefined,
      });

      toast.success(`🎉 Welcome to Pawcation, ${formData.name}!`);
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    setState(prev => ({ ...prev, step: 1 }));
  };

  return {
    state,
    isSubmitting,
    setImageFile,
    analyzeImage,
    createProfile,
    goBack,
  };
}