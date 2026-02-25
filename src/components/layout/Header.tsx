import { motion } from "framer-motion";
import { Undo2, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  showUndo?: boolean;
  showSearch?: boolean;
  onUndo?: () => void;
  title?: string;
}

export const Header = ({ showUndo, showSearch, onUndo, title }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 glass-overlay z-50 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Left: Logo or Back */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PS</span>
          </div>
          {title ? (
            <span className="font-semibold text-foreground">{title}</span>
          ) : (
            <span className="font-semibold text-foreground">PitchSwipe</span>
          )}
        </Link>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {showUndo && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUndo}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Undo2 className="w-5 h-5" />
            </motion.button>
          )}
          {showSearch && (
            <Link 
              to="/search"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
