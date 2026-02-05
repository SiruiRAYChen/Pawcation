import { ImageCropper } from '@/components/pet/ImageCropper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api, Pet } from '@/lib/api';
import { motion } from 'framer-motion';
import { Camera, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetAdded: () => void;
  editingPet?: Pet | null;
}

export function AddPetModal({ isOpen, onClose, onPetAdded, editingPet }: AddPetModalProps) {
  // Birthday/Age mode: 'birthday' or 'estimated_age'
  const [dobMode, setDobMode] = useState<'birthday' | 'estimated_age'>('birthday');
  
  // Birthday mode state
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayYear, setBirthdayYear] = useState('');

  // Age estimation mode state
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [gottchaDay, setGottchaDay] = useState('');
  const [showGottchaOption, setShowGottchaOption] = useState(false);

  // Basic pet info
  const [petData, setPetData] = useState<Partial<Pet>>({
    name: '',
    breed: '',
    size: '',
    gender: '',
    personality: [],
    health: '',
    appearance: '',
    rabies_expiration: '',
    microchip_id: '',
    image_url: '',
    avatar_url: '',
  });

  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [healthTags, setHealthTags] = useState<string[]>([]);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [originalData, setOriginalData] = useState<{
    petData: Partial<Pet>;
    weightValue: string;
    weightUnit: 'kg' | 'lbs';
    gender: 'male' | 'female' | '';
    healthTags: string[];
    personalityTags: string[];
    dobMode: 'birthday' | 'estimated_age';
    birthdayMonth: string;
    birthdayDay: string;
    birthdayYear: string;
    ageYears: string;
    ageMonths: string;
    gottchaDay: string;
    avatar: string | null;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  // Utility functions
  const calculateEstimatedDOB = (years: number, months: number): string => {
    const today = new Date();
    const dob = new Date(today);
    dob.setFullYear(dob.getFullYear() - years);
    dob.setMonth(dob.getMonth() - months);
    return dob.toISOString().split('T')[0];
  };

  const parseDateOfBirth = (dateStr: string | undefined): { years: number; months: number } => {
    if (!dateStr) return { years: 0, months: 0 };
    try {
      const dob = new Date(dateStr);
      const today = new Date();
      let years = today.getFullYear() - dob.getFullYear();
      let months = today.getMonth() - dob.getMonth();
      
      if (months < 0) {
        years--;
        months += 12;
      }
      return { years, months };
    } catch {
      return { years: 0, months: 0 };
    }
  };

  const parseDateString = (dateStr: string | undefined): { month: string; day: string; year: string } => {
    if (!dateStr) return { month: '', day: '', year: '' };
    try {
      const [year, month, day] = dateStr.split('-');
      return { month: month.padStart(2, '0'), day: day.padStart(2, '0'), year };
    } catch {
      return { month: '', day: '', year: '' };
    }
  };

  const getNumericPart = (value?: string) => {
    if (!value) return '';
    const match = value.match(/\d+(?:\.\d+)?/);
    return match ? match[0] : '';
  };

  const parseWeight = (value?: string) => {
    const numeric = getNumericPart(value);
    const lower = value?.toLowerCase() || '';
    const detectedUnit: 'kg' | 'lbs' = lower.includes('lb') ? 'lbs' : 'kg';
    return { numeric, unit: detectedUnit };
  };

  const parseTagString = (value?: string): string[] => {
    if (!value) return [];
    return value.split(',').map(t => t.trim()).filter(Boolean);
  };

  const clampNumberInput = (value: string, min: number, max: number, padLength = 2) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) return '';
    let num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) return '';
    num = Math.min(Math.max(num, min), max);
    const str = num.toString();
    return str.padStart(padLength, '0').slice(-padLength);
  };

  const isValidBirthDate = (monthStr: string, dayStr: string, yearStr: string) => {
    if (monthStr.length !== 2 || dayStr.length !== 2 || yearStr.length !== 4) return false;
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);
    if ([month, day, year].some(n => Number.isNaN(n))) return false;
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    if (year < 1900 || year > currentYear) return false;

    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    ) {
      return false;
    }

    const today = new Date();
    candidate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (candidate > today) return false;

    return true;
  };

  // Initialize form when editing
  useEffect(() => {
    if (isOpen && editingPet) {
      setIsEditMode(true);
      
      setPetData({
        name: editingPet.name || '',
        breed: editingPet.breed || '',
        size: editingPet.size || '',
        gender: editingPet.gender || '',
        personality: editingPet.personality || [],
        health: editingPet.health || '',
        appearance: editingPet.appearance || '',
        rabies_expiration: editingPet.rabies_expiration ? 
          new Date(editingPet.rabies_expiration).toISOString().split('T')[0] : '',
        microchip_id: editingPet.microchip_id || '',
        image_url: editingPet.image_url || '',
        avatar_url: editingPet.avatar_url || '',
      });

      const weight = parseWeight(editingPet.size);
      setWeightValue(weight.numeric);
      setWeightUnit(weight.unit);
      const genderValue = (editingPet.gender as 'male' | 'female') || '';
      console.log('Setting gender:', genderValue, 'from editingPet:', editingPet.gender);
      setGender(genderValue);
      setPetData(prev => ({ ...prev, gender: genderValue }));

      setHealthTags(parseTagString(editingPet.health));
      setPersonalityTags(Array.isArray(editingPet.personality) ? editingPet.personality : parseTagString(editingPet.personality as unknown as string));

      // Parse date of birth
      if (editingPet.date_of_birth) {
        if (editingPet.is_dob_estimated) {
          setDobMode('estimated_age');
          const { years, months } = parseDateOfBirth(editingPet.date_of_birth);
          setAgeYears(years.toString());
          setAgeMonths(months.toString());
        } else {
          setDobMode('birthday');
          const { month, day, year } = parseDateString(editingPet.date_of_birth);
          setBirthdayMonth(month);
          setBirthdayDay(day);
          setBirthdayYear(year);
        }
      }

      if (editingPet.gotcha_day) {
        setGottchaDay(editingPet.gotcha_day);
        setShowGottchaOption(true);
      }

      if (editingPet.avatar_url || editingPet.image_url) {
        setPreviewImage(editingPet.avatar_url || editingPet.image_url);
        setCroppedAvatar(editingPet.avatar_url || editingPet.image_url);
      }

      // Save original data for change detection
      setOriginalData({
        petData: {
          name: editingPet.name || '',
          breed: editingPet.breed || '',
          size: editingPet.size || '',
          gender: genderValue,
          personality: editingPet.personality || [],
          health: editingPet.health || '',
          rabies_expiration: editingPet.rabies_expiration ? new Date(editingPet.rabies_expiration).toISOString().split('T')[0] : '',
          microchip_id: editingPet.microchip_id || '',
          image_url: editingPet.image_url || '',
          avatar_url: editingPet.avatar_url || '',
        },
        weightValue: weight.numeric,
        weightUnit: weight.unit,
        gender: genderValue,
        healthTags: parseTagString(editingPet.health),
        personalityTags: Array.isArray(editingPet.personality) ? editingPet.personality : parseTagString(editingPet.personality as unknown as string),
        dobMode: editingPet.is_dob_estimated ? 'estimated_age' : 'birthday',
        birthdayMonth: editingPet.date_of_birth ? parseDateString(editingPet.date_of_birth).month : '',
        birthdayDay: editingPet.date_of_birth ? parseDateString(editingPet.date_of_birth).day : '',
        birthdayYear: editingPet.date_of_birth ? parseDateString(editingPet.date_of_birth).year : '',
        ageYears: editingPet.date_of_birth && editingPet.is_dob_estimated ? parseDateOfBirth(editingPet.date_of_birth).years.toString() : '',
        ageMonths: editingPet.date_of_birth && editingPet.is_dob_estimated ? parseDateOfBirth(editingPet.date_of_birth).months.toString() : '',
        gottchaDay: editingPet.gotcha_day || '',
        avatar: editingPet.avatar_url || editingPet.image_url || null,
      });
    } else if (isOpen && !editingPet) {
      console.log('CREATE MODE: Resetting form');
      // Reset form
      setIsEditMode(false);
      setDobMode('birthday');
      setBirthdayMonth('');
      setBirthdayDay('');
      setBirthdayYear('');
      setAgeYears('');
      setAgeMonths('');
      setGottchaDay('');
      setShowGottchaOption(false);

      setPetData({
        name: '',
        breed: '',
        size: '',
        gender: '',
        personality: [],
        health: '',
        appearance: '',
        rabies_expiration: '',
        microchip_id: '',
        image_url: '',
        avatar_url: '',
      });

      setWeightValue('');
      setWeightUnit('lbs');
      setGender('');
      setHealthTags([]);
      setPersonalityTags([]);
      setImageFile(null);
      setPreviewImage(null);
      setCroppedAvatar(null);
      setOriginalData(null);
    } else if (!isOpen) {
      setOriginalData(null);
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

  // Validation
  const trimmedName = (petData.name || '').trim();
  const trimmedBreed = (petData.breed || '').trim();
  const trimmedWeight = weightValue.trim();
  const hasPhoto = Boolean(croppedAvatar || previewImage || petData.avatar_url || petData.image_url);

  let isMissingDOB = false;
  if (dobMode === 'birthday') {
    isMissingDOB = !birthdayMonth || !birthdayDay || !birthdayYear;
  } else {
    isMissingDOB = !ageYears || ageYears === '0';
  }

  const isMissingRequired = !trimmedName || !trimmedBreed || isMissingDOB || !trimmedWeight || !gender || !hasPhoto;

  // Change detection for edit mode
  let hasChanges = false;
  if (originalData) {
    // Check each field for changes
    const nameChanged = trimmedName !== (originalData.petData.name || '').trim();
    const breedChanged = trimmedBreed !== (originalData.petData.breed || '').trim();
    const weightChanged = trimmedWeight !== originalData.weightValue;
    const weightUnitChanged = weightUnit !== originalData.weightUnit;
    const genderChanged = gender !== originalData.gender;
    const healthTagsChanged = healthTags.join(',') !== originalData.healthTags.join(',');
    const personalityTagsChanged = personalityTags.join(',') !== originalData.personalityTags.join(',');
    const rabiesChanged = petData.rabies_expiration !== originalData.petData.rabies_expiration;
    const microchipChanged = petData.microchip_id !== originalData.petData.microchip_id;
    const avatarChanged = croppedAvatar && croppedAvatar !== originalData.avatar;
    const dobModeChanged = dobMode !== originalData.dobMode;
    const birthdayChanged = dobMode === 'birthday' && (
      birthdayMonth !== originalData.birthdayMonth ||
      birthdayDay !== originalData.birthdayDay ||
      birthdayYear !== originalData.birthdayYear
    );
    const ageChanged = dobMode === 'estimated_age' && (
      ageYears !== originalData.ageYears ||
      ageMonths !== originalData.ageMonths
    );
    const gottchaDayChanged = gottchaDay !== originalData.gottchaDay;

    hasChanges = 
      nameChanged || 
      breedChanged || 
      weightChanged || 
      weightUnitChanged || 
      genderChanged || 
      healthTagsChanged || 
      personalityTagsChanged || 
      rabiesChanged || 
      microchipChanged || 
      avatarChanged || 
      dobModeChanged || 
      birthdayChanged || 
      ageChanged || 
      gottchaDayChanged;
  }

  const canSaveUpdate = isEditMode && hasChanges && !isMissingRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please log in first.', variant: 'destructive' });
      return;
    }

    if (isMissingRequired) {
      toast({ title: 'Please fill in all required fields (name, breed, DOB/age, weight, gender, and photo).', variant: 'destructive' });
      return;
    }

    let dateOfBirth: string;
    let isEstimated: boolean;

    if (dobMode === 'birthday') {
      if (!isValidBirthDate(birthdayMonth, birthdayDay, birthdayYear)) {
        toast({ title: 'Please enter a valid birth date (not in the future).', variant: 'destructive' });
        return;
      }
      dateOfBirth = `${birthdayYear}-${birthdayMonth}-${birthdayDay}`;
      isEstimated = false;
    } else {
      const years = parseInt(ageYears) || 0;
      const months = parseInt(ageMonths) || 0;
      dateOfBirth = calculateEstimatedDOB(years, months);
      isEstimated = true;
    }

    const normalizedPersonality = personalityTags.length
      ? personalityTags
      : Array.isArray(petData.personality)
        ? petData.personality
        : petData.personality ? [petData.personality] : [];

    const healthValue = healthTags.length ? healthTags.join(', ') : 'Healthy';

    const payload: Pet = {
      ...petData,
      user_id: user.user_id,
      name: trimmedName,
      breed: trimmedBreed,
      date_of_birth: dateOfBirth,
      is_dob_estimated: isEstimated,
      gotcha_day: gottchaDay || undefined,
      size: `${trimmedWeight} ${weightUnit}`,
      gender,
      personality: normalizedPersonality,
      health: healthValue
    } as Pet;

    try {
      if (isEditMode && editingPet?.pet_id) {
        await api.updatePet(editingPet.pet_id, payload);
        toast({ title: 'Pet updated successfully!' });
      } else {
        await api.createPet(payload as Omit<Pet, 'pet_id'>);
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
    setDobMode('birthday');
    setBirthdayMonth('');
    setBirthdayDay('');
    setBirthdayYear('');
    setAgeYears('');
    setAgeMonths('');
    setGottchaDay('');
    setShowGottchaOption(false);
    setPetData({
      name: '',
      breed: '',
      size: '',
      gender: '',
      personality: [],
      health: '',
      appearance: '',
      rabies_expiration: '',
      microchip_id: '',
      image_url: '',
      avatar_url: '',
    });
    setWeightValue('');
    setWeightUnit('lbs');
    setGender('');
    setHealthTags([]);
    setPersonalityTags([]);
    setImageFile(null);
    setPreviewImage(null);
    setCroppedAvatar(null);
    setShowCropper(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />
      
      <motion.div 
        className="relative bg-white rounded-2xl shadow-2xl w-full mx-auto max-w-md max-h-[75vh] overflow-hidden flex flex-col my-8"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
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
                        className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500"
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
                  className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-9"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Photo with AI'}
                </Button>
              )}
            </div>

            {/* Name & Breed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
                <Input
                  id="name"
                  value={petData.name || ''}
                  onChange={(e) => setPetData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 h-9 text-sm"
                  placeholder="Pet's name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="breed" className="text-sm font-medium text-gray-700">Breed *</Label>
                <Input
                  id="breed"
                  value={petData.breed || ''}
                  onChange={(e) => setPetData(prev => ({ ...prev, breed: e.target.value }))}
                  className="mt-1 h-9 text-sm"
                  placeholder="e.g., Golden"
                  required
                />
              </div>
            </div>

            {/* Date of Birth / Age Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Date of Birth *</Label>
              
              {/* Radio Toggle */}
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="dob-mode"
                    value="birthday"
                    checked={dobMode === 'birthday'}
                    onChange={(e) => setDobMode(e.target.value as 'birthday' | 'estimated_age')}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-sm text-gray-700">I know the exact date</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="dob-mode"
                    value="estimated_age"
                    checked={dobMode === 'estimated_age'}
                    onChange={(e) => {
                      setDobMode(e.target.value as 'birthday' | 'estimated_age');
                      setShowGottchaOption(true);
                    }}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-sm text-gray-700">I don't know the exact date (Enter Age)</span>
                </label>
              </div>

              {/* Birthday Input */}
              {dobMode === 'birthday' && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1">
                    <Input
                      id="pet-birth-month"
                      name="birthMonth"
                      type="text"
                      inputMode="numeric"
                      placeholder="MM"
                      value={birthdayMonth}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        if (digitsOnly === '') {
                          setBirthdayMonth('');
                        } else {
                          const num = parseInt(digitsOnly, 10);
                          if (num > 12) {
                            setBirthdayMonth('12');
                          } else {
                            setBirthdayMonth(digitsOnly.slice(0, 2));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val && val.length === 1) {
                          setBirthdayMonth(val.padStart(2, '0'));
                        }
                      }}
                      className="h-9 text-sm text-center"
                      maxLength={2}
                    />
                  </div>
                  <span className="text-gray-400">/</span>
                  <div className="flex-1">
                    <Input
                      id="pet-birth-day"
                      name="birthDay"
                      type="text"
                      inputMode="numeric"
                      placeholder="DD"
                      value={birthdayDay}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        if (digitsOnly === '') {
                          setBirthdayDay('');
                        } else {
                          const num = parseInt(digitsOnly, 10);
                          if (num > 31) {
                            setBirthdayDay('31');
                          } else {
                            setBirthdayDay(digitsOnly.slice(0, 2));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val && val.length === 1) {
                          setBirthdayDay(val.padStart(2, '0'));
                        }
                      }}
                      className="h-9 text-sm text-center"
                      maxLength={2}
                    />
                  </div>
                  <span className="text-gray-400">/</span>
                  <div className="flex-1">
                    <Input
                      id="pet-birth-year"
                      name="birthYear"
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY"
                      value={birthdayYear}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setBirthdayYear(digitsOnly);
                      }}
                      className="h-9 text-sm text-center"
                      maxLength={4}
                    />
                  </div>
                </div>
              )}

              {/* Age Estimation Input */}
              {dobMode === 'estimated_age' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <Label className="text-xs text-gray-600">Years</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        placeholder="0"
                        value={ageYears}
                        onChange={(e) => setAgeYears(e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Months</Label>
                      <Input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="0"
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Gotcha Day Option */}
                  <div className="border-t pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGottchaOption}
                        onChange={(e) => {
                          setShowGottchaOption(e.target.checked);
                          if (!e.target.checked) setGottchaDay('');
                        }}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span className="text-sm text-gray-700">Do you know the Gotcha Day?</span>
                    </label>
                    {showGottchaOption && (
                      <div className="mt-2">
                        <Input
                          type="date"
                          value={gottchaDay}
                          onChange={(e) => setGottchaDay(e.target.value)}
                          className="h-9 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">When you brought your pet home</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Weight & Gender (one row) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">Weight *</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    placeholder=""
                    className="h-9 text-sm w-12"
                    required
                  />
                  <div className="flex rounded-md border border-gray-300 overflow-hidden">
                    <Button
                      type="button"
                      variant={weightUnit === 'lbs' ? 'default' : 'ghost'}
                      className={`h-9 px-3 text-sm rounded-none flex-1 ${weightUnit === 'lbs' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-gray-700'}`}
                      onClick={() => setWeightUnit('lbs')}
                    >
                      lbs
                    </Button>
                    <Button
                      type="button"
                      variant={weightUnit === 'kg' ? 'default' : 'ghost'}
                      className={`h-9 px-3 text-sm rounded-none flex-1 ${weightUnit === 'kg' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-gray-700'}`}
                      onClick={() => setWeightUnit('kg')}
                    >
                      kg
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Gender *</Label>
                <div className="mt-1 flex rounded-full overflow-hidden border border-gray-300">
                  <Button
                    type="button"
                    variant={gender === 'male' ? 'default' : 'ghost'}
                    className={`h-9 text-sm flex-1 rounded-none ${gender === 'male' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-gray-700'}`}
                    onClick={() => {
                      setGender('male');
                      setPetData(prev => ({ ...prev, gender: 'male' }));
                    }}
                  >
                    Boy
                  </Button>
                  <Button
                    type="button"
                    variant={gender === 'female' ? 'default' : 'ghost'}
                    className={`h-9 text-sm flex-1 rounded-none ${gender === 'female' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-gray-700'}`}
                    onClick={() => {
                      setGender('female');
                      setPetData(prev => ({ ...prev, gender: 'female' }));
                    }}
                  >
                    Girl
                  </Button>
                </div>
              </div>
            </div>

            {/* Health Condition */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Health Conditions</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  'Heart Condition',
                  'Breathing Issues',
                  'Motion Sickness',
                  'Pregnant / Nursing',
                  'Recovering from Surgery',
                  'Allergies',
                  'Separation Anxiety',
                ].map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant={healthTags.includes(tag) ? 'default' : 'outline'}
                    className={`h-8 px-3 text-xs rounded-full ${healthTags.includes(tag) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white text-gray-700'}`}
                    onClick={() => {
                      setHealthTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                    }}
                  >
                    {tag}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={healthTags.length === 0 ? 'default' : 'ghost'}
                  className={`h-8 px-3 text-xs rounded-full ${healthTags.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}
                  onClick={() => setHealthTags([])}
                >
                  None / Healthy
                </Button>
              </div>
            </div>

            {/* Personality */}
            <div>
              <Label className="text-sm font-medium text-gray-700">What’s your furry friend’s Vibe?</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  'Zoomie Master',
                  'Social Butterfly',
                  'Pack Player',
                  'Couch Potato',
                  'Vocalist',
                  'Sensitive Soul',
                  'Protective',
                  'Treat Seeker',
                ].map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant={personalityTags.includes(tag) ? 'default' : 'outline'}
                    className={`h-8 px-3 text-xs rounded-full ${personalityTags.includes(tag) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white text-gray-700'}`}
                    onClick={() => {
                      setPersonalityTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rabies & Microchip */}
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

            {/* Submit Button */}
            <div className="pt-3 pb-6">
              <Button
                type="submit"
                className={`w-full text-sm h-10 ${
                  isEditMode && !canSaveUpdate
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                disabled={isEditMode ? !canSaveUpdate : isMissingRequired}
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
