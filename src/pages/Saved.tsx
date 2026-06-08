import { motion } from "framer-motion";
import { Bookmark, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { formatCurrency, stageColors } from "@/lib/mock-data";
import { getSavedStartups } from "@/lib/data-store";
import { cn } from "@/lib/utils";

const Saved = () => {
  const savedStartups = getSavedStartups();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Saved Startups" />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        {savedStartups.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              You have {savedStartups.length} saved startups
            </p>

            <div className="grid grid-cols-2 gap-3">
              {savedStartups.map((startup, index) => (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/startup/${startup.id}`}
                    className="block card-base overflow-hidden group"
                  >
                    <div className="relative aspect-[3/4]">
                      <img
                        src={startup.videoPoster}
                        alt={startup.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <div className="w-7 h-7 rounded-full bg-warning/90 flex items-center justify-center">
                          <Bookmark className="w-3.5 h-3.5 text-warning-foreground" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", stageColors[startup.stage])}>
                          {startup.stage}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-white text-sm mb-0.5 truncate">
                          {startup.name}
                        </h3>
                        <p className="text-white/70 text-xs truncate">{startup.industry}</p>
                        <p className="text-white font-medium text-sm mt-1">
                          {formatCurrency(startup.raiseAmount)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No saved startups yet</h2>
            <p className="text-muted-foreground mb-6">
              Tap the save button on a pitch to add it here.
            </p>
            <Link to="/feed" className="btn-primary inline-flex">
              Browse Startups
            </Link>
          </motion.div>
        )}
      </main>

      <InvestorNav />
    </div>
  );
};

export default Saved;
