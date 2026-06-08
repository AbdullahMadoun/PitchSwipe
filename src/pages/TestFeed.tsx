import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCard } from "@/components/swipe/VideoCard";
import { SwipeControls } from "@/components/swipe/SwipeControls";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { Startup } from "@/lib/mock-data";
import { saveStartupId, addUnlockedId } from "@/lib/data-store";
import { ensureThreadForStartup } from "@/lib/chat-store";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";

// Bulletproof fallback data - this will ALWAYS work
const BULLETPROOF_STARTUPS: Startup[] = [
  {
    id: "demo-1",
    name: "TechFlow AI",
    tagline: "AI-powered workflow automation",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoPoster: "https://via.placeholder.com/400x600/10B981/ffffff?text=TechFlow+AI",
    industry: "AI/ML",
    stage: "Seed",
    raiseAmount: 500000,
    valuation: 10000000,
    equityPercent: 5,
    minTicket: 1000,
    founderName: "Sarah Chen",
    founderAvatar: "https://via.placeholder.com/100x100/059669/ffffff?text=SC",
    tags: ["AI", "B2B", "SaaS"],
    description: "Revolutionary AI platform for business automation that helps companies streamline their workflows and increase productivity.",
    revenue: 25000,
    burnRate: 8000,
    runwayMonths: 24,
    growthPercent: 45,
    leadInvestor: "Tech Ventures"
  },
  {
    id: "demo-2", 
    name: "GreenTech Solutions",
    tagline: "Sustainable energy for everyone",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    videoPoster: "https://via.placeholder.com/400x600/10B981/ffffff?text=GreenTech",
    industry: "CleanTech",
    stage: "Series A",
    raiseAmount: 2000000,
    valuation: 15000000,
    equityPercent: 8,
    minTicket: 5000,
    founderName: "Ahmed Al-Rashid",
    founderAvatar: "https://via.placeholder.com/100x100/059669/ffffff?text=AR",
    tags: ["CleanTech", "Energy", "Hardware"],
    description: "Next-generation solar technology making renewable energy accessible to everyone with innovative panel designs and smart grid integration.",
    revenue: 75000,
    burnRate: 15000,
    runwayMonths: 18,
    growthPercent: 30,
    leadInvestor: "Green Capital"
  },
  {
    id: "demo-3",
    name: "HealthHub Pro",
    tagline: "Digital health platform",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    videoPoster: "https://via.placeholder.com/400x600/10B981/ffffff?text=HealthHub",
    industry: "HealthTech",
    stage: "Seed",
    raiseAmount: 750000,
    valuation: 12000000,
    equityPercent: 6,
    minTicket: 2000,
    founderName: "Dr. Fatima Al-Zahra",
    founderAvatar: "https://via.placeholder.com/100x100/059669/ffffff?text=FA",
    tags: ["HealthTech", "Platform", "B2B"],
    description: "Connecting patients with healthcare providers through an innovative digital platform that streamlines appointments, consultations, and medical records.",
    revenue: 15000,
    burnRate: 5000,
    runwayMonths: 36,
    growthPercent: 60,
    leadInvestor: "Health Ventures"
  }
];

interface VideoData {
  id: string;
  name: string;
  tagline: string;
  video_url: string;
  industry: string;
  stage: string;
  raise_amount: number;
  min_ticket: number;
  equity_percent: number;
  founder_name?: string;
  location?: string;
}

const TestFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState<number>(Date.now());
  const [useApi, setUseApi] = useState(true);
  const [apiStartups, setApiStartups] = useState<VideoData[]>([]);
  const touchStartY = useRef<number | null>(null);
  const navigate = useNavigate();

  // Get current startup (either from API or fallback)
  const getCurrentStartup = (): Startup | null => {
    if (useApi && apiStartups.length > 0) {
      const apiData = apiStartups[currentIndex];
      if (apiData) {
        return {
          id: apiData.id,
          name: apiData.name,
          tagline: apiData.tagline,
          videoUrl: apiData.video_url,
          videoPoster: "https://via.placeholder.com/400x600/10B981/ffffff?text=" + encodeURIComponent(apiData.name),
          industry: apiData.industry,
          stage: apiData.stage,
          raiseAmount: apiData.raise_amount,
          valuation: apiData.raise_amount * 20, // Estimate valuation
          equityPercent: apiData.equity_percent,
          minTicket: apiData.min_ticket,
          founderName: apiData.founder_name || "Founder",
          founderAvatar: "https://via.placeholder.com/100x100/059669/ffffff?text=" + encodeURIComponent((apiData.founder_name || "F").substring(0, 2)),
          tags: [apiData.industry, apiData.stage],
          description: "Startup description from API"
        };
      }
    }
    
    // Always fallback to bulletproof data
    return BULLETPROOF_STARTUPS[currentIndex % BULLETPROOF_STARTUPS.length] || null;
  };

  const currentStartup = getCurrentStartup();

  // Try to setup API on mount, but don't block if it fails
  useEffect(() => {
    const setupApi = async () => {
      try {
        // Set user ID
        const userId = localStorage.getItem('userId') || '4a3f2c1c-f590-4084-9181-51f6afa79a5a';
        localStorage.setItem('userId', userId);
        
        // Try onboarding (but don't wait for it)
        apiClient.investorOnboard(
          "I'm interested in all types of startups, especially tech companies", 
          ["Tech", "B2B", "SaaS"]
        ).catch(e => console.log("Onboarding failed, using fallback:", e));
        
        // Try to fetch initial videos
        const response = await apiClient.getNextVideo();
        if (response.video) {
          setApiStartups([response.video]);
          setUseApi(true);
        } else {
          setUseApi(false);
        }
      } catch (error) {
        console.log("API setup failed, using fallback data:", error);
        setUseApi(false);
      }
    };

    setupApi();
  }, []);

  const fetchNextVideo = useCallback(async () => {
    if (!useApi) {
      // Just increment index for fallback data
      setCurrentIndex(prev => (prev + 1) % BULLETPROOF_STARTUPS.length);
      return;
    }

    try {
      const response = await apiClient.getNextVideo();
      if (response.video) {
        setApiStartups(prev => [...prev.slice(-2), response.video]); // Keep last 3
        setCurrentIndex(prev => prev + 1);
      } else {
        // Switch to fallback if no more API data
        setUseApi(false);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.log("Failed to fetch next video, using fallback:", error);
      setUseApi(false);
      setCurrentIndex(prev => (prev + 1) % BULLETPROOF_STARTUPS.length);
    }
  }, [useApi]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "down" | "save") => {
      if (!currentStartup) return;

      const watchTime = (Date.now() - watchStartTime) / 1000;

      // Try to record interaction, but don't fail if it doesn't work
      if (useApi) {
        try {
          await apiClient.recordInteraction(
            currentStartup.id,
            direction === "save" ? "down" : direction,
            watchTime,
            60 // 60 second videos
          );
        } catch (error) {
          console.log("Failed to record interaction, continuing anyway:", error);
        }
      }

      if (direction === "right") {
        addUnlockedId(currentStartup.id);
        ensureThreadForStartup(currentStartup.id);
        toast({
          title: "🔓 Data Room Unlocked!",
          description: `You can now view ${currentStartup.name}'s full details`,
        });
        navigate(`/startup/${currentStartup.id}`);
      } else if (direction === "left") {
        toast({
          title: "👋 Passed",
          description: `Skipped ${currentStartup.name}`,
        });
      } else if (direction === "save") {
        saveStartupId(currentStartup.id);
        toast({
          title: "📌 Saved for later",
          description: `${currentStartup.name} added to your watchlist`,
        });
      } else if (direction === "down") {
        toast({
          title: "➡️ Next pitch",
          description: "Moving to next startup",
        });
      }

      // Move to next startup
      if (direction !== "save") {
        await fetchNextVideo();
        setWatchStartTime(Date.now());
      }
    },
    [currentStartup, watchStartTime, navigate, fetchNextVideo, useApi]
  );

  const handleSave = useCallback(() => {
    handleSwipe("save");
  }, [handleSwipe]);

  const handleUndo = useCallback(async () => {
    // For simplicity, just go back one index
    setCurrentIndex(prev => Math.max(0, prev - 1));
    toast({
      title: "↩️ Undo successful",
      description: "Brought back the previous card",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setWatchStartTime(Date.now());
  }, []);

  const handleWheel = (event: React.WheelEvent) => {
    if (event.deltaY > 10) {
      handleSwipe("down");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - (e.changedTouches[0]?.clientY ?? 0);
    if (delta > 30) {
      handleSwipe("down");
    }
    touchStartY.current = null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showUndo={true} showSearch onUndo={handleUndo} />
      
      <main className="pt-16 pb-24 px-4">
        {/* Debug info */}
        <div className="text-xs text-muted-foreground mb-2 text-center">
          {useApi ? "🟢 API Mode" : "🔵 Fallback Mode"} | Startup {currentIndex + 1}
        </div>

        <div
          className="relative h-[calc(100vh-220px)] max-w-md mx-auto"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading startups...</p>
                </div>
              </motion.div>
            ) : currentStartup ? (
              <VideoCard
                key={currentStartup.id}
                startup={currentStartup}
                onSwipe={handleSwipe}
                isTop
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  You're all caught up!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Check back later for more startups or browse manually.
                </p>
                <button 
                  onClick={handleRefresh}
                  className="btn-primary"
                >
                  Restart Demo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {currentStartup && !loading && (
          <div className="mt-6">
            <SwipeControls
              onPass={() => handleSwipe("left")}
              onSave={handleSave}
              onUnlock={() => handleSwipe("right")}
            />
          </div>
        )}
      </main>
      
      <InvestorNav />
    </div>
  );
};

export default TestFeed;