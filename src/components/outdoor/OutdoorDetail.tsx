import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface OutdoorDetailProps {
  place_id?: string;
}

interface OutdoorDetailData {
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
  userId?: string;
}

type TabType = 'photos' | 'reviews';

export const OutdoorDetail = ({ place_id: propPlaceId }: OutdoorDetailProps) => {
  const { place_id: paramPlaceId } = useParams<{ place_id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [outdoorData, setOutdoorData] = useState<OutdoorDetailData | null>(null);
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
  const initialData = location.state?.outdoorData;

  useEffect(() => {
    if (!placeId) {
      setError("No place ID provided");
      setIsLoading(false);
      return;
    }

    fetchOutdoorDetails();
  }, [placeId]);

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

  const fetchOutdoorDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error("Google Maps API key not found");
      }

      // If we have initial data and it includes a phone number, use it
      if (initialData?.nationalPhoneNumber) {
        setOutdoorData({
          id: placeId,
          name: initialData.name || "Unknown Place",
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

      setOutdoorData({
        id: data.id || placeId,
        name: data.displayName?.text || initialData?.name || "Unknown Place",
        address: data.formattedAddress || initialData?.address,
        photos: photoUrls,
        rating: data.rating || initialData?.rating,
        nationalPhoneNumber: data.nationalPhoneNumber,
        websiteUri: data.websiteUri,
      });
    } catch (err) {
      console.error("Error fetching outdoor place details:", err);
      setError(err instanceof Error ? err.message : "Failed to load place details");
      
      // Fall back to initial data if available
      if (initialData) {
        setOutdoorData({
          id: placeId,
          name: initialData.name || "Unknown Place",
          address: initialData.address,
          photos: initialData.photos || [],
          rating: initialData.rating,
          nationalPhoneNumber: initialData.nationalPhoneNumber,
          websiteUri: initialData.websiteUri,
        });
        setError(null);
      } else {
        toast({
          title: "Failed to load place details",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (outdoorData?.nationalPhoneNumber) {
      window.location.href = `tel:${outdoorData.nationalPhoneNumber}`;
    } else {
      toast({
        title: "Phone number not available",
        description: "Contact information is not available for this place",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!placeId || !reviewForm.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        placeId: placeId,
        rating: reviewForm.rating,
        content: reviewForm.content,
        createdAt: serverTimestamp(),
        userName: user?.name || "Anonymous",
        userId: user?.user_id || null
      });

      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });

      // Reset form
      setReviewForm({ rating: 5, content: '' });
      setShowReviewForm(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Failed to submit review",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast({
        title: "Review deleted",
        description: "Your review has been removed.",
      });
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Failed to delete review",
        description: "Please try again later",
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
            <h1 className="text-xl font-bold">Place Details</h1>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading place details...</p>
        </div>
      </div>
    );
  }

  if (error || !outdoorData) {
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
            <h1 className="text-xl font-bold">Place Details</h1>
          </div>
        </div>
        
        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-destructive mb-4">{error || "Place not found"}</p>
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
          <h1 className="text-xl font-bold">Place Details</h1>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="w-full h-64 bg-muted">
        {outdoorData.photos.length > 0 ? (
          <img
            src={outdoorData.photos[0]}
            alt={outdoorData.name}
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

      {/* Place Info Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6 space-y-4"
      >
        {/* Place Name and Rating */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {outdoorData.name}
          </h1>
          {outdoorData.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{outdoorData.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">Google Rating</span>
            </div>
          )}
        </div>

        {/* Address */}
        {outdoorData.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
            <h3 className="text-lg text-muted-foreground leading-relaxed">
              {outdoorData.address}
            </h3>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'photos'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'photos' && outdoorData.photos.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {outdoorData.photos.slice(1, 5).map((photo, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={photo}
                    alt={`${outdoorData.name} photo ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Reviews</h3>
              <Button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </Button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitReview}
                className="bg-muted p-4 rounded-lg space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rating (1-5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
                    placeholder="Share your experience..."
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Submit Review
                </Button>
              </motion.form>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 && !showReviewForm ? (
                <p className="text-muted-foreground text-center py-8">
                  No reviews yet. Be the first to write one!
                </p>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted p-4 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.userName || 'Anonymous'}
                        </span>
                      </div>
                      {user?.user_id && review.userId === user.user_id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-xs text-destructive hover:text-destructive/80"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-foreground">{review.content}</p>
                    {review.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt.toDate()).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))
              ) : null}
            </div>
          </div>
        )}

      </motion.div>

      {/* Action Button */}
      <div className="px-4 mt-6">
        <Button
          onClick={handleCall}
          disabled={!outdoorData.nationalPhoneNumber}
          className="w-full h-12 text-lg font-semibold"
        >
          {outdoorData.nationalPhoneNumber ? "Call Place" : "Phone not available"}
        </Button>
      </div>

      {/* Website Link */}
      {outdoorData.websiteUri && (
        <div className="px-4 mt-3">
          <Button
            variant="outline"
            onClick={() => window.open(outdoorData.websiteUri, '_blank')}
            className="w-full h-12 text-lg font-semibold"
          >
            Visit Website
          </Button>
        </div>
      )}
    </div>
  );
};