import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Edit3 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, email, updateUser, deleteAccount } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Original data for dirty checking
  const [originalData, setOriginalData] = useState({
    name: '',
    avatar: null as string | null,
  });

  // Initialize data
  useEffect(() => {
    if (user) {
      const initialName = user.name || '';
      const initialAvatar = user.avatar_url || null;
      
      setName(initialName);
      setAvatar(initialAvatar);
      setOriginalData({
        name: initialName,
        avatar: initialAvatar,
      });
    }
  }, [user]);

  // Check if form has changes
  const hasChanges = () => {
    return (
      name !== originalData.name ||
      avatar !== originalData.avatar
    );
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const updates: any = {};
      
      if (name !== originalData.name) {
        updates.name = name;
      }
      
      if (avatar !== originalData.avatar) {
        updates.avatar_url = avatar;
      }

      await api.updateUser(user.user_id, updates);
      
      // Update the user context with new data
      updateUser({
        name: name || undefined,
        avatar_url: avatar || undefined,
      });
      
      toast({ title: 'Profile updated successfully!' });
      navigate('/home');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  };

  const handleBackClick = () => {
    if (hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      navigate('/home');
    }
  };

  const handleConfirmSave = () => {
    handleSave();
  };

  const handleCancelSave = () => {
    navigate('/home');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        await deleteAccount();
        toast({ title: 'Account deleted successfully' });
        navigate('/login');
      } catch (error: any) {
        toast({ title: error.message || 'Failed to delete account', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleBackClick}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative inline-block">
            <div 
              className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center cursor-pointer hover:bg-emerald-200 transition-colors"
              onClick={handleAvatarClick}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-emerald-600" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Tap to edit</p>
          <input
            id="profile-avatar-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </motion.div>

        {/* Input Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="h-12 rounded-xl border-emerald-200 focus:border-emerald-500"
            />
          </div>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email || ''}
              disabled
              className="h-12 rounded-xl bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value="********"
                readOnly
                onClick={() => navigate('/change-password')}
                placeholder="********"
                className="h-12 rounded-xl border-emerald-200 focus:border-emerald-500 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 pointer-events-none"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Save Changes Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pt-6"
        >
          <Button
            onClick={handleSave}
            disabled={!hasChanges()}
            className={`w-full h-12 rounded-xl font-medium transition-all duration-200 ${
              hasChanges() 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            SAVE CHANGES
          </Button>
        </motion.div>

        {/* Delete Account Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4"
        >
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            DELETE ACCOUNT
          </Button>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Unsaved Changes"
        description="Do you want to save your modifications?"
        cancelText="No"
        confirmText="Yes"
        onCancel={handleCancelSave}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
};