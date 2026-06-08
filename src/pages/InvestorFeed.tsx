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

const InvestorFeed = () => {
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchStartTime, setWatchStartTime] = useState<number>(Date.now());
  const [lastSwiped, setLastSwiped] = useState<VideoData | null>(null);
  const touchStartY = useRef<number | null>(null);
  const navigate = useNavigate();

  const fetchNextVideo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getNextVideo();
      if (response.video) {
        setCurrentVideo(response.video);
        setWatchStartTime(Date.now());
      } else {
        setCurrentVideo(null);
        toast({
          title: "No more startups",
          description: "You've seen all available startups!",
        });
      }
    } catch (error) {
      console.error("Error fetching video:", error);
      toast({
        title: "Error",
        description: "Failed to load next startup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNextVideo();
  }, [fetchNextVideo]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "down" | "save") => {
      if (!currentVideo) return;

      // Calculate watch time
      const watchTime = (Date.now() - watchStartTime) / 1000; // in seconds
      const videoLength = 60; // Assuming 60 second videos

      // Record interaction with backend
      try {
        await apiClient.recordInteraction(
          currentVideo.id,
          direction === "save" ? "down" : direction,
          watchTime,
          videoLength
        );
      } catch (error) {
        console.error("Failed to record interaction:", error);
      }

      if (direction === "right") {
        addUnlockedId(currentVideo.id);
        ensureThreadForStartup(currentVideo.id);
        toast({
          title: "🔓 Data Room Unlocked!",
          description: `You can now view ${currentVideo.name}'s full details`,
        });
        navigate(`/startup/${currentVideo.id}`);
      } else if (direction === "left") {
        toast({
          title: "👋 Passed",
          description: `Skipped ${currentVideo.name}`,
        });
      } else if (direction === "save") {
        saveStartupId(currentVideo.id);
        toast({
          title: "📌 Saved for later",
          description: `${currentVideo.name} added to your watchlist`,
        });
      } else if (direction === "down") {
        toast({
          title: "➡️ Next pitch",
          description: "Moving to next startup",
        });
      }

      // Fetch next video
      if (direction !== "save") {
        fetchNextVideo();
      }
    },
    [currentVideo, watchStartTime, navigate, fetchNextVideo]
  );

  const handleSave = useCallback(() => {
    handleSwipe("save");
  }, [handleSwipe]);

  const handleUndo = useCallback(async () => {
    try {
      await apiClient.undoSwipe();
      await fetchNextVideo(); // Re-fetch to get the previous video
      toast({
        title: "↩️ Undo successful",
        description: "Brought back the last card",
      });
    } catch (error) {
      console.error("Failed to undo:", error);
    }
  }, [fetchNextVideo]);

  const handleRefresh = useCallback(() => {
    fetchNextVideo();
  }, [fetchNextVideo]);

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

  // Convert API video to Startup format for VideoCard compatibility
  const currentAsStartup: Startup | null = currentVideo ? {
    id: currentVideo.id,
    name: currentVideo.name,
    tagline: currentVideo.tagline,
    videoUrl: currentVideo.video_url,
    industry: currentVideo.industry,
    stage: currentVideo.stage,
    raiseAmount: currentVideo.raise_amount,
    minTicket: currentVideo.min_ticket,
    equity: currentVideo.equity_percent,
    founderName: currentVideo.founder_name || "Founder",
    location: currentVideo.location || "Saudi Arabia",
    description: "",
    pitchDeck: "",
    valuation: 0,
    metrics: {
      revenue: "$0 MRR",
      growth: "0% MoM",
      customers: "0 customers"
    }
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <Header showUndo={false} showSearch onUndo={handleUndo} />
      
      <main className="pt-16 pb-24 px-4">
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
            ) : currentAsStartup ? (
              <VideoCard
                key={currentAsStartup.id}
                startup={currentAsStartup}
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
                  Refresh Feed
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {currentAsStartup && !loading && (
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

export default InvestorFeed;
