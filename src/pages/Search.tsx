import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, SlidersHorizontal, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { formatCurrency, stageColors } from "@/lib/mock-data";
import { getAllStartups } from "@/lib/data-store";
import { cn } from "@/lib/utils";

const Search = () => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const startups = useMemo(() => getAllStartups(), []);

  const filteredStartups = startups.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.tagline.toLowerCase().includes(query.toLowerCase()) ||
      s.industry.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Discover" />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        {/* Search Bar */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search startups..."
            className="input-base pl-12 pr-12"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              showFilters ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 card-base"
          >
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Stage ▾
              </button>
              <button className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Industry ▾
              </button>
              <button className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Raise Size ▾
              </button>
            </div>
          </motion.div>
        )}

        {/* Trending Section */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {query ? "Results" : "Trending"}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredStartups.map((startup, index) => (
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

        {filteredStartups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No startups found</p>
          </div>
        )}
      </main>

      <InvestorNav />
    </div>
  );
};

export default Search;
