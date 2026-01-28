import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, AlertTriangle, Plane, Train, Weight, Ruler } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

export const TransitDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { providerId } = useParams();
  
  // Get provider data from navigation state
  const provider = location.state?.provider;

  const handleBackClick = () => {
    navigate('/transit');
  };

  const handleOfficialSiteClick = () => {
    if (provider?.official_url) {
      window.open(provider.official_url, '_blank');
    }
  };

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Provider not found</h1>
          <Button onClick={handleBackClick} variant="outline">
            Back to Transit List
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = provider.id === 'amtrak' ? Train : Plane;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-gray-200 safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{provider.name}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Large Logo + Name + Official Site Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50/50 rounded-2xl p-6 border border-green-300"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center border border-green-300">
              <IconComponent className="w-10 h-10 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">{provider.name}</h1>
              <Badge 
                variant="secondary" 
                className="bg-gray-100 text-gray-600 border border-gray-200"
              >
                {provider.id === 'amtrak' ? 'Train' : 'Airline'}
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={handleOfficialSiteClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Official Site
          </Button>
        </motion.div>

        {/* Warning Section */}
        {provider.standout_warning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 rounded-2xl p-4 border border-amber-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Important Notice</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {provider.standout_warning}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="cabin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-green-50 rounded-xl border border-green-300">
              <TabsTrigger 
                value="cabin" 
                className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Cabin
              </TabsTrigger>
              <TabsTrigger 
                value="cargo" 
                className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Cargo
              </TabsTrigger>
            </TabsList>

            {/* Cabin Content */}
            <TabsContent value="cabin" className="mt-6">
              <div className="bg-green-50/50 rounded-2xl p-6 border border-green-300 space-y-4">
                {/* Fee */}
                <div className="text-center pb-4 border-b border-green-300">
                  <p className="text-green-700 font-medium mb-1">Cabin Fee</p>
                  <p className="text-4xl font-bold text-green-900">
                    ${provider.cabin.fee}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Weight Limit */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-300">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Weight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Weight Limit</p>
                      <p className="text-sm text-muted-foreground">{provider.cabin.weight_limit}</p>
                    </div>
                  </div>

                  {/* Dimensions */}
                  {provider.cabin.max_dimensions && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-300">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Dimensions</p>
                        <p className="text-sm text-muted-foreground">{provider.cabin.max_dimensions}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {provider.cabin.notes && provider.cabin.notes.length > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-green-300">
                    <h4 className="font-medium text-foreground mb-2">Additional Notes</h4>
                    <ul className="space-y-1">
                      {provider.cabin.notes.map((note: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Cargo Content */}
            <TabsContent value="cargo" className="mt-6">
              {provider.cargo?.allowed ? (
                <div className="bg-green-50/50 rounded-2xl p-6 border border-green-300 space-y-4">
                  {/* Fee */}
                  <div className="text-center pb-4 border-b border-green-300">
                    <p className="text-green-700 font-medium mb-1">Cargo Fee</p>
                    <p className="text-4xl font-bold text-green-900">
                      ${provider.cargo.fee}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Weight Limit */}
                    {provider.cargo.weight_limit && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-300">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Weight className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Weight Limit</p>
                          <p className="text-sm text-muted-foreground">{provider.cargo.weight_limit}</p>
                        </div>
                      </div>
                    )}

                    {/* Restrictions */}
                    {provider.cargo.restrictions && (
                      <div className="p-4 bg-white rounded-xl border border-green-300">
                        <h4 className="font-medium text-foreground mb-2">Restrictions</h4>
                        <p className="text-sm text-muted-foreground">{provider.cargo.restrictions}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {provider.cargo.notes && provider.cargo.notes.length > 0 && (
                    <div className="p-4 bg-white rounded-xl border border-green-300">
                      <h4 className="font-medium text-foreground mb-2">Additional Notes</h4>
                      <ul className="space-y-1">
                        {provider.cargo.notes.map((note: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📦</span>
                    </div>
                    <h3 className="font-medium text-foreground mb-2">Cargo Transport Unavailable</h3>
                  </div>
                  
                  {/* Show reason if available */}
                  {provider.cargo?.notes && provider.cargo.notes.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <h4 className="font-medium text-amber-900 mb-2">Limited Availability</h4>
                      <ul className="space-y-1">
                        {provider.cargo.notes.map((note: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-amber-800">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Default message if no specific reason */}
                  {(!provider.cargo?.notes || provider.cargo.notes.length === 0) && (
                    <p className="text-sm text-gray-600 text-center">
                      This carrier does not offer cargo transport for pets.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};