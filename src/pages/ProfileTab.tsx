import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetCard } from "@/components/pet/PetCard";
import { PawIcon } from "@/components/icons/PawIcon";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileTab = () => {
  const { user, email, logout } = useAuth();
  const navigate = useNavigate();

  const { data: pets, isLoading, error } = useQuery({
    queryKey: ["pets", user?.user_id],
    queryFn: () => api.getUserPets(user!.user_id),
    enabled: !!user,
  });

  const handleAddPetClick = () => {
    navigate('/add-pet');
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
      <div className="px-4 pt-8 pb-4 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <PawIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">My Pets</h1>
          </div>
          {user && (
            <Button
              onClick={handleAddPetClick}
              size="sm"
              className="gradient-primary rounded-full shadow-glow"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Pet
            </Button>
          )}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{email}</p>
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
              <PetCard pet={pet} />
            </motion.div>
          ))
        )}
        {pets && pets.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">You haven't added any pets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
