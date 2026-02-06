import homeIcon from "@/assets/home.png";
import { AddPetModal } from "@/components/pet/AddPetModal";
import { PetCard } from "@/components/pet/PetCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LogOut, Plus, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const ProfileTab = () => {
  const { user, email, logout } = useAuth();
  const navigate = useNavigate();
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);

  const { data: pets, isLoading, error, refetch } = useQuery({
    queryKey: ["pets", user?.user_id],
    queryFn: () => api.getUserPets(user!.user_id),
    enabled: !!user,
  });

  const handleAddPetClick = () => {
    setIsAddPetModalOpen(true);
  };

  const handlePetAdded = () => {
    refetch(); // Refresh the pets list
  };

  const handleEditPet = (pet: any) => {
    setEditingPet(pet);
    setIsAddPetModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddPetModalOpen(false);
    setEditingPet(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  }

  return (
    <div className="min-h-screen pb-24 gradient-hero">
      {/* Header */}
      <div className="px-4 pb-4 safe-top-xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <img src={homeIcon} alt="Home" className="w-6 h-6" />
          <h1 className="text-2xl font-extrabold text-foreground">My Pets</h1>
        </motion.div>
        <p className="text-muted-foreground mt-1">
          Your travel companions
        </p>
      </div>

      {/* User Info Card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-paw"
        >
          {user ? (
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                onClick={handleProfileClick}
              >
                {/* User Avatar */}
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}
                <div>
                  {/* Display name if available, otherwise email */}
                  <p className="font-bold text-foreground">
                    {user.name || email}
                  </p>
                  <p className="text-sm text-muted-foreground">Pet Parent</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4">Please log in to see your pets.</p>
              <Button onClick={handleLogin}>Login</Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pet List */}
      <div className="px-4 space-y-4">
        {/* Remove empty skeleton boxes */}
        {error && <p className="text-destructive text-center">Failed to load pets.</p>}
        {pets && pets.length > 0 && (
          pets.map((pet) => (
            <motion.div
              key={pet.pet_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PetCard 
                pet={pet}
                onEdit={() => handleEditPet(pet)}
                onDelete={() => refetch()}
              />
            </motion.div>
          ))
        )}
        
        {/* Add Pet Button (Circular, centered below pet list) */}
        {user && pets && pets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center pt-4 pb-2"
          >
            <Button
              onClick={handleAddPetClick}
              size="lg"
              className="w-16 h-16 rounded-full gradient-primary shadow-glow p-0"
            >
              <Plus className="w-8 h-8" />
            </Button>
          </motion.div>
        )}
        
        {pets && pets.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <p className="text-muted-foreground">You haven't added any pets yet.</p>
            {user && (
              <Button
                onClick={handleAddPetClick}
                size="lg"
                className="gradient-primary rounded-full shadow-glow"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Pet
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Pet Modal */}
      <AddPetModal 
        isOpen={isAddPetModalOpen} 
        onClose={handleModalClose}
        onPetAdded={handlePetAdded}
        editingPet={editingPet}
      />
    </div>
  );
};
