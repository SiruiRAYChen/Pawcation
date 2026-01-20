import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import AddPetPage from "./pages/AddPetPage";
import { PlanTab } from "./pages/PlanTab";
import { ExploreTab } from "./pages/ExploreTab";
import { ProfileTab } from "./pages/ProfileTab";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Index />}>
              <Route index element={<Navigate to="/explore" replace />} />
              <Route path="explore" element={<ExploreTab />} />
              <Route path="plan" element={<PlanTab />} />
              <Route path="profile" element={<ProfileTab />} />
            </Route>
            <Route path="/add-pet" element={<AddPetPage />} />
            <Route path="/add-pet/:petId" element={<AddPetPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
