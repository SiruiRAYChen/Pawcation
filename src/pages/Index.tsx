import { PawIcon } from "@/components/icons/PawIcon";
import { BottomNav, Tab } from "@/components/layout/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import pawPrint from "@/assets/paw-print.png";

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
    if (path.startsWith('/memories')) return 'memories';
    if (path.startsWith('/home')) return 'profile';
    return 'explore';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.3,
                  ease: "easeInOut",
                }}
              >
                <img 
                  src={pawPrint} 
                  alt="Paw" 
                  className="w-6 h-6 opacity-70"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(65%) sepia(18%) saturate(800%) hue-rotate(95deg) brightness(98%) contrast(85%)'
                  }}
                />
              </motion.div>
            ))}
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
