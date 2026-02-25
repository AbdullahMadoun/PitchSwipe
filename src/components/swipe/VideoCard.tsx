import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Startup, formatCurrency, stageColors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  startup: Startup;
  onSwipe: (direction: "left" | "right" | "down") => void;
  isTop: boolean;
}

export const VideoCard = ({ startup, onSwipe, isTop }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Swipe indicator opacity based on drag
  const leftIndicatorOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  const downIndicatorOpacity = useTransform(y, [0, 50, 100], [0, 0.5, 1]);

  useEffect(() => {
    if (isTop && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isTop]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = 500;
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      onSwipe("right");
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      onSwipe("left");
    } else if (info.offset.y > threshold || info.velocity.y > velocity) {
      onSwipe("down");
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.div
      className={cn(
        "swipe-card bg-card",
        !isTop && "pointer-events-none"
      )}
      style={{ x, y, rotate, opacity }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Video */}
      <div className="relative w-full h-full" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={startup.videoUrl}
          poster={startup.videoPoster}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
        />
        
        {/* Bottom gradient for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        
        {/* Swipe indicators */}
        <motion.div 
          className="absolute top-1/2 left-6 -translate-y-1/2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-xl border-4 border-destructive-foreground rotate-[-20deg]"
          style={{ opacity: leftIndicatorOpacity }}
        >
          PASS
        </motion.div>
        <motion.div 
          className="absolute top-1/2 right-6 -translate-y-1/2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xl border-4 border-primary-foreground rotate-[20deg]"
          style={{ opacity: rightIndicatorOpacity }}
        >
          UNLOCK
        </motion.div>
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-warning text-warning-foreground font-bold text-xl border-4 border-warning-foreground"
          style={{ opacity: downIndicatorOpacity }}
        >
          NEXT
        </motion.div>
        
        {/* Play/Pause indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}
        
        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white">
              <img src={startup.founderAvatar} alt={startup.founderName} className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-medium text-sm drop-shadow-lg">{startup.founderName}</span>
          </div>
          <button 
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", stageColors[startup.stage] || "badge-stage")}>
              {startup.stage}
            </span>
            {startup.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="badge-industry">#{tag}</span>
            ))}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-1">{startup.name}</h2>
          <p className="text-white/80 text-sm mb-4 line-clamp-2">{startup.tagline}</p>
          
          <div className="grid grid-cols-2 gap-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">💰 Raising</span>
              <span className="font-semibold">{formatCurrency(startup.raiseAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">🎫 Min</span>
              <span className="font-semibold">{formatCurrency(startup.minTicket)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">📊 Valuation</span>
              <span className="font-semibold">{formatCurrency(startup.valuation)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">📈 Equity</span>
              <span className="font-semibold">{startup.equityPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
