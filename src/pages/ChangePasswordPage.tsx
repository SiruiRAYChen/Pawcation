import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Verification states
  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if new passwords match and are valid
  const isNewPasswordValid = () => {
    return newPassword.length >= 6 && newPassword.length <= 15 && newPassword === confirmPassword;
  };

  // Validate new password length
  const getNewPasswordError = () => {
    if (newPassword.length > 0 && (newPassword.length < 6 || newPassword.length > 15)) {
      return 'Password must be between 6-15 characters';
    }
    return '';
  };

  // Verify current password in real-time
  const verifyCurrentPasswordRealTime = async (password: string) => {
    if (!password.trim()) {
      setIsCurrentPasswordVerified(false);
      setCurrentPasswordError('');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user?.email, 
          password: password 
        }),
      });

      if (response.ok) {
        setIsCurrentPasswordVerified(true);
        setCurrentPasswordError('');
      } else {
        setIsCurrentPasswordVerified(false);
        setCurrentPasswordError('Password mismatch. Please try again.');
      }
    } catch (error) {
      setIsCurrentPasswordVerified(false);
      setCurrentPasswordError('Verification failed. Please try again.');
    }
  };

  // Save new password
  const handleSavePassword = async () => {
    if (!user || !isNewPasswordValid()) return;

    try {
      await api.updateUser(user.user_id, { password: newPassword });
      toast({ title: 'Password updated successfully!' });
      navigate('/profile');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({ title: 'Failed to update password', variant: 'destructive' });
    }
  };

  const handleBackClick = () => {
    navigate('/profile');
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
        <h1 className="text-lg font-bold text-gray-900">Change Password</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      <div className="px-6 py-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Current Password Field */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setCurrentPassword(newValue);
                  setCurrentPasswordError('');
                  // Real-time verification with debounce
                  clearTimeout(window.verifyTimeout);
                  window.verifyTimeout = setTimeout(() => {
                    verifyCurrentPasswordRealTime(newValue);
                  }, 500);
                }}
                placeholder="Enter current password"
                className={`h-12 rounded-xl pr-20 ${
                  currentPasswordError 
                    ? 'border-red-300 focus:border-red-500' 
                    : isCurrentPasswordVerified 
                    ? 'border-emerald-300 focus:border-emerald-500'
                    : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
              
              {/* Verification Status Icon */}
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 flex items-center justify-center">
                {isCurrentPasswordVerified ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : currentPasswordError ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
              
              {/* Show Password Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 focus:outline-none focus:ring-0 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </div>
            {currentPasswordError && (
              <p className="text-sm text-red-600 mt-1">{currentPasswordError}</p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= 15) { // Prevent typing beyond 15 chars
                    setNewPassword(newValue);
                  }
                }}
                placeholder={isCurrentPasswordVerified ? "Enter new password (6-15 characters)" : "Verify current password first"}
                disabled={!isCurrentPasswordVerified}
                minLength={6}
                maxLength={15}
                className={`h-12 rounded-xl pr-12 ${
                  !isCurrentPasswordVerified 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : getNewPasswordError()
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 focus:outline-none focus:ring-0 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={!isCurrentPasswordVerified}
              >
                {showNewPassword ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </div>
            {isCurrentPasswordVerified && getNewPasswordError() && (
              <p className="text-sm text-red-600 mt-1">{getNewPasswordError()}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= 15) { // Prevent typing beyond 15 chars
                    setConfirmPassword(newValue);
                  }
                }}
                placeholder={isCurrentPasswordVerified ? "Re-enter new password (6-15 chars)" : "Verify current password first"}
                disabled={!isCurrentPasswordVerified}
                maxLength={15}
                className={`h-12 rounded-xl pr-12 ${
                  !isCurrentPasswordVerified 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 focus:outline-none focus:ring-0 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!isCurrentPasswordVerified}
              >
                {showConfirmPassword ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </div>
            {isCurrentPasswordVerified && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>
        </motion.div>

        {/* Save Button */}
        {isCurrentPasswordVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-6"
          >
            <Button
              onClick={handleSavePassword}
              disabled={!isNewPasswordValid()}
              className={`w-full h-12 rounded-xl font-medium transition-all duration-200 ${
                isNewPasswordValid()
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              SAVE NEW PASSWORD
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};