import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav, Tab } from "@/components/layout/BottomNav";
import { PawIcon } from "@/components/icons/PawIcon";

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const getActiveTab = (): Tab => {
    const path = location.pathname;
    if (path.startsWith('/plan')) return 'plan';
    if (path.startsWith('/home')) return 'profile';
    return 'explore';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <PawIcon className="w-12 h-12 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Render the active tab's component */}
      <Outlet />

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={getActiveTab()} 
        onTabChange={(tab) => {
          const route = tab === 'profile' ? '/home' : `/${tab}`;
          navigate(route);
        }} 
      />
    </div>
  );
};

export default Index;
