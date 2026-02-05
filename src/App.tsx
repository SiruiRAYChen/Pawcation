import { HotelDetail } from "./components/hotel/HotelDetail";
import { RestaurantDetail } from "./components/restaurant/RestaurantDetail";
import { OutdoorDetail } from "./components/outdoor/OutdoorDetail";
import { HospitalDetail } from "./components/hospital/HospitalDetail";
import { PetServiceDetail } from "./components/petservice/PetServiceDetail";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AddPetPage from "./pages/AddPetPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DiningPage } from "./pages/DiningPage";
import { ExploreTab } from "./pages/ExploreTab";
import { HospitalPage } from "./pages/HospitalPage";
import { HotelsPage } from "./pages/HotelsPage";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import { MemoriesTab } from "./pages/MemoriesTab";
import NotFound from "./pages/NotFound";
import { OutdoorActivityPage } from "./pages/OutdoorActivityPage";
import { PetServicesPage } from "./pages/PetServicesPage";
import { PlanTab } from "./pages/PlanTab";
import { ProfilePage } from "./pages/ProfilePage";
import { ProfileTab } from "./pages/ProfileTab";
import { TransitDetailPage } from "./pages/TransitDetailPage";
import { TransitPage } from "./pages/TransitPage";
import { TripDetailPage } from "./pages/TripDetailPage";

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
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="explore" element={<ExploreTab />} />
              <Route path="plan" element={<PlanTab />} />
              <Route path="memories" element={<MemoriesTab />} />
              <Route path="home" element={<ProfileTab />} />
            </Route>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/add-pet" element={<AddPetPage />} />
            <Route path="/add-pet/:petId" element={<AddPetPage />} />
            <Route path="/memories/trip/:tripId" element={<TripDetailPage />} />
            <Route path="/transit" element={<TransitPage />} />
            <Route path="/transit/:providerId" element={<TransitDetailPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/hotels/:place_id" element={<HotelDetail />} />
            <Route path="/hospital" element={<HospitalPage />} />
            <Route path="/hospital/:place_id" element={<HospitalDetail />} />
            <Route path="/dining" element={<DiningPage />} />
            <Route path="/dining/:place_id" element={<RestaurantDetail />} />
            <Route path="/outdoor" element={<OutdoorActivityPage />} />
            <Route path="/outdoor/:place_id" element={<OutdoorDetail />} />
            <Route path="/pet-services" element={<PetServicesPage />} />
            <Route path="/pet-services/:place_id" element={<PetServiceDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
