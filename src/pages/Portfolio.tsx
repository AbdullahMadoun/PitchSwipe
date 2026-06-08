import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { formatCurrency, stageColors } from "@/lib/mock-data";
import { getUnlockedStartups, getInvestedStartups } from "@/lib/data-store";
import { cn } from "@/lib/utils";

const Portfolio = () => {
  const unlocked = getUnlockedStartups();
  const invested = getInvestedStartups();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Unlocked Deals" />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Invested</h2>
          {invested.length > 0 ? (
            <div className="space-y-3">
              {invested.map((startup, index) => (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-base p-4 flex gap-3 border-primary/30"
                >
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-muted">
                    <img src={startup.videoPoster} alt={startup.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{startup.name}</h3>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", stageColors[startup.stage])}>
                        {startup.stage}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{startup.tagline}</p>
                    <div className="text-sm text-foreground">
                      <div>Valuation: <span className="font-semibold">{formatCurrency(startup.valuation)}</span></div>
                      <div>Equity: <span className="font-semibold">{startup.equityPercent}%</span></div>
                      <div>Raise: <span className="font-semibold">{formatCurrency(startup.raiseAmount)}</span></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      {startup.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="badge-industry">#{tag}</span>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Link to={`/startup/${startup.id}`} className="text-primary text-sm font-medium hover:underline">
                        View details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm mb-6">No investments yet.</div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Unlocked</h2>
          {unlocked.length > 0 ? (
            <div className="space-y-3">
              {unlocked.map((startup, index) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-base p-4 flex gap-3"
              >
                <div className="w-20 h-28 rounded-xl overflow-hidden bg-muted">
                  <img src={startup.videoPoster} alt={startup.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{startup.name}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", stageColors[startup.stage])}>
                      {startup.stage}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{startup.tagline}</p>
                  <div className="text-sm text-foreground">
                    <div>Valuation: <span className="font-semibold">{formatCurrency(startup.valuation)}</span></div>
                    <div>Equity: <span className="font-semibold">{startup.equityPercent}%</span></div>
                    <div>Raise: <span className="font-semibold">{formatCurrency(startup.raiseAmount)}</span></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {startup.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge-industry">#{tag}</span>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Link to={`/startup/${startup.id}`} className="text-primary text-sm font-medium hover:underline">
                      View details
                    </Link>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">No unlocked deals yet</h2>
              <p className="text-muted-foreground mb-6">Swipe right on pitches to unlock their data room.</p>
              <Link to="/feed" className="btn-primary inline-flex">
                Go to feed
              </Link>
            </motion.div>
          )}
        </section>
      </main>

      <InvestorNav />
    </div>
  );
};

export default Portfolio;

