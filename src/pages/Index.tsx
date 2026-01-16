import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PlanTab } from "@/pages/PlanTab";
import { ExploreTab } from "@/pages/ExploreTab";
import { ProfileTab } from "@/pages/ProfileTab";

type Tab = "plan" | "explore" | "profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("plan");

  return (
    <div className="min-h-screen bg-background">
      {/* Tab Content */}
      {activeTab === "plan" && <PlanTab />}
      {activeTab === "explore" && <ExploreTab />}
      {activeTab === "profile" && <ProfileTab />}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
