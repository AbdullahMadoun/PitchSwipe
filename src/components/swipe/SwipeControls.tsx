import { motion } from "framer-motion";
import { X, Bookmark, Star } from "lucide-react";

interface SwipeControlsProps {
  onPass: () => void;
  onSave: () => void;
  onUnlock: () => void;
}

export const SwipeControls = ({ onPass, onSave, onUnlock }: SwipeControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Pass Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-card border-2 border-destructive text-destructive flex items-center justify-center shadow-lg hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
      >
        <X className="w-8 h-8" strokeWidth={3} />
      </motion.button>
      
      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSave}
        className="w-14 h-14 rounded-full bg-card border-2 border-warning text-warning flex items-center justify-center shadow-lg hover:bg-warning hover:text-warning-foreground transition-colors duration-200"
      >
        <Bookmark className="w-7 h-7" strokeWidth={3} />
      </motion.button>
      
      {/* Unlock Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUnlock}
        className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-hover transition-colors duration-200"
      >
        <Star className="w-8 h-8" fill="currentColor" />
      </motion.button>
    </div>
  );
};
