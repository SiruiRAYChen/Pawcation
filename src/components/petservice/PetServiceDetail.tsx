import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface PetServiceDetailProps {
  place_id?: string;
}

interface PetServiceDetailData {
  id: string;
  name: string;
  address?: string;
  photos: string[];
  rating?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: any;
  userName?: string;
}

type TabType = 'photos' | 'reviews';

export const PetServiceDetail = ({ place_id: propPlaceId }: PetServiceDetailProps) => {
  const { place_id: paramPlaceId } = useParams<{ place_id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [serviceData, setServiceData] = useState<PetServiceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    content: ''
  });
  
  // Get place_id from props, URL params, or location state
  const placeId = propPlaceId || paramPlaceId || location.state?.place_id;
  
  // Get initial data from navigation state if available
  const initialData = location.state?.serviceData;

  useEffect(() => {
    if (!placeId) {
      setError("No service ID provided");
      setIsLoading(false);
      return;
    }

    fetchServiceDetails();
  }, [placeId]);

  const fetchServiceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error("Google Maps API key not found");
      }

      // If we have initial data and it includes a phone number, use it
      if (initialData?.nationalPhoneNumber) {
        setServiceData({
          id: placeId,
          name: initialData.name || "Unknown Service",
          address: initialData.address,
          photos: initialData.photos || [],
          rating: initialData.rating,
          nationalPhoneNumber: initialData.nationalPhoneNumber,
          websiteUri: initialData.websiteUri,
        });
        setIsLoading(false);
        return;
      }

      // Fetch detailed information from Google Places API
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,photos,rating,nationalPhoneNumber,websiteUri"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process photos
      const photoUrls = data.photos?.map((photo: any) => 
        `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`
      ) || [];

      setServiceData({
        id: data.id || placeId,
        name: data.displayName?.text || initialData?.name || "Unknown Service",
        address: data.formattedAddress || initialData?.address,
        photos: photoUrls,
        rating: data.rating || initialData?.rating,
        nationalPhoneNumber: data.nationalPhoneNumber,
        websiteUri: data.websiteUri,
      });
    } catch (err) {
      console.error("Error fetching service details:", err);
      setError(err instanceof Error ? err.message : "Failed to load service details");
      
      // Fall back to initial data if available
      if (initialData) {
        setServiceData({
          id: placeId,
          name: initialData.name || "Unknown Service",
          address: initialData.address,
          photos: initialData.photos || [],
          rating: initialData.rating,
          nationalPhoneNumber: initialData.nationalPhoneNumber,
          websiteUri: initialData.websiteUri,
        });
        setError(null);
      } else {
        toast({
          title: "Failed to load service details",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reviews from Firebase
  useEffect(() => {
    if (!placeId) return;

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('placeId', '==', placeId)
      // orderBy('createdAt', 'desc') // Temporarily commented - waiting for index to build
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData: Review[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      setReviews(reviewsData);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });

    return () => unsubscribe();
  }, [placeId]);

  const handleCall = () => {
    if (serviceData?.nationalPhoneNumber) {
      window.location.href = `tel:${serviceData.nationalPhoneNumber}`;
    } else {
      toast({
        title: "Phone number not available",
        description: "Contact information is not available for this service",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Service Details</h1>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !serviceData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Service Details</h1>
          </div>
        </div>
        
        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-destructive mb-4">{error || "Service not found"}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Service Details</h1>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="w-full h-64 bg-muted">
        {serviceData.photos.length > 0 ? (
          <img
            src={serviceData.photos[0]}
            alt={serviceData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p>No image available</p>
            </div>
          </div>
        )}
      </div>

      {/* Service Info Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6 space-y-4"
      >
        {/* Service Name and Rating */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {serviceData.name}
          </h1>
          {serviceData.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{serviceData.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">Google Rating</span>
            </div>
          )}
        </div>

        {/* Address */}
        {serviceData.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
            <h3 className="text-lg text-muted-foreground leading-relaxed">
              {serviceData.address}
            </h3>
          </div>
        )}

        {/* Additional Photos */}
        {serviceData.photos.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {serviceData.photos.slice(1, 5).map((photo, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={photo}
                    alt={`${serviceData.name} photo ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Action Button */}
      <div className="px-4 mt-6">
        <Button
          onClick={handleCall}
          disabled={!serviceData.nationalPhoneNumber}
          className="w-full h-12 text-lg font-semibold"
        >
          {serviceData.nationalPhoneNumber ? "Call Service" : "Phone not available"}
        </Button>
      </div>

      {/* Website Link */}
      {serviceData.websiteUri && (
        <div className="px-4 mt-3">
          <Button
            variant="outline"
            onClick={() => window.open(serviceData.websiteUri, '_blank')}
            className="w-full h-12 text-lg font-semibold"
          >
            Visit Website
          </Button>
        </div>
      )}
    </div>
  );
};