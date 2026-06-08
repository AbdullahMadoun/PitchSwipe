import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { formatCurrency, stageColors } from "@/lib/mock-data";
import { getAllStartups, getUnlockedIds, saveStartupId, addInvestedId, addUnlockedId } from "@/lib/data-store";
import { cn } from "@/lib/utils";
import { Bookmark, MessageCircle, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InvestmentModal } from "@/components/InvestmentModal";
import { createThread, appendMessage } from "@/lib/chat-store";

interface Props {
  startupIdOverride?: string;
  forceUnlocked?: boolean;
  hideNav?: boolean;
}

const StartupDetails = ({ startupIdOverride, forceUnlocked, hideNav }: Props) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const effectiveId = startupIdOverride || id;
  const startup = useMemo(() => getAllStartups().find((s) => s.id === effectiveId), [effectiveId]);
  const unlocked = new Set(getUnlockedIds());
  const [showInvestModal, setShowInvestModal] = useState(false);

  if (!startup) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Details" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Startup not found.
        </div>
        {!hideNav && <InvestorNav />}
      </div>
    );
  }

  const isUnlocked = forceUnlocked || unlocked.has(startup.id);

  const handleSave = () => {
    saveStartupId(startup.id);
    toast({
      title: "📌 Saved",
      description: `${startup.name} added to your watchlist`,
    });
  };

  const handleInvestment = (amount: number, numTickets: number, isBid: boolean) => {
    if (isBid) {
      // Send bid request through messaging system
      const threadId = createThread(startup.id);
      
      // Create bid request message
      const bidMessage = {
        id: crypto.randomUUID(),
        sender: "investor" as const,
        text: `💰 Investment Bid Request\n\nI'd like to invest in ${startup.name} with the following terms:\n• Number of tickets: ${numTickets}\n• Price per ticket: ${formatCurrency(amount / numTickets)}\n• Total investment: ${formatCurrency(amount)}\n\nThis is below your minimum ticket price of ${formatCurrency(startup.minTicket)}. Would you be willing to accept this offer?`,
        timestamp: Date.now(),
      };
      
      // Send the bid request message
      appendMessage(threadId, bidMessage);
      
      // Navigate to the chat
      navigate(`/messages/${threadId}`);
      
      toast({
        title: "📨 Bid Request Sent",
        description: `Your bid has been sent to ${startup.founderName} via message`,
      });
    } else {
      // Regular investment
      addInvestedId(startup.id);
      toast({
        title: "✅ Investment Confirmed",
        description: `Successfully invested ${formatCurrency(amount)} in ${startup.name}`,
      });
    }
  };

  const handleStartChat = () => {
    // Create a new chat thread with this startup
    const threadId = createThread(startup.id);
    navigate(`/messages/${threadId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={startup.name} />

      <main className="pt-20 px-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-2xl overflow-hidden bg-muted aspect-video relative">
          <video src={startup.videoUrl} poster={startup.videoPoster} className="w-full h-full object-cover" controls />
          <div className="absolute top-3 right-3">
            <button
              onClick={handleSave}
              className="rounded-full bg-card border border-border px-3 py-1.5 text-sm flex items-center gap-2 shadow"
            >
              <Bookmark className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", stageColors[startup.stage])}>
            {startup.stage}
          </span>
          <span className="text-sm text-muted-foreground">{startup.industry}</span>
        </div>

        <p className="text-lg font-semibold text-foreground">{startup.tagline}</p>

        {isUnlocked && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvestModal(true)}
              className="btn-primary flex items-center gap-2 flex-1"
            >
              <DollarSign className="w-4 h-4" />
              Invest
            </button>
            <button
              onClick={handleStartChat}
              className="btn-secondary flex items-center gap-2 flex-1"
            >
              <MessageCircle className="w-4 h-4" />
              Message Founder
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="card p-3">
            <p className="text-muted-foreground text-xs mb-1">Raising</p>
            <p className="font-semibold">{formatCurrency(startup.raiseAmount)}</p>
          </div>
          <div className="card p-3">
            <p className="text-muted-foreground text-xs mb-1">Valuation</p>
            <p className="font-semibold">{formatCurrency(startup.valuation)}</p>
          </div>
          <div className="card p-3">
            <p className="text-muted-foreground text-xs mb-1">Equity</p>
            <p className="font-semibold">{startup.equityPercent}%</p>
          </div>
          <div className="card p-3">
            <p className="text-muted-foreground text-xs mb-1">Min Ticket</p>
            <p className="font-semibold">{formatCurrency(startup.minTicket)}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {startup.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="badge-industry">#{tag}</span>
          ))}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-foreground mb-2">Description</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{startup.description}</p>
        </div>

        {isUnlocked ? (
          <div className="card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">UNLOCKED</span>
              <span className="text-sm text-muted-foreground">Data room preview</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Financials are demo-only. In a full build, this would include revenue, burn, runway, and cap table.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="card p-3">
                <p className="text-muted-foreground text-xs mb-1">Revenue (demo)</p>
                <p className="font-semibold">{startup.revenue ? formatCurrency(startup.revenue) : "$50K/mo"}</p>
              </div>
              <div className="card p-3">
                <p className="text-muted-foreground text-xs mb-1">Burn (demo)</p>
                <p className="font-semibold">{startup.burnRate ? formatCurrency(startup.burnRate) : "$20K/mo"}</p>
              </div>
              <div className="card p-3">
                <p className="text-muted-foreground text-xs mb-1">Runway (demo)</p>
                <p className="font-semibold">{startup.runwayMonths ? `${startup.runwayMonths} mo` : "12 mo"}</p>
              </div>
              <div className="card p-3">
                <p className="text-muted-foreground text-xs mb-1">Lead Investor</p>
                <p className="font-semibold">{startup.leadInvestor ?? "TBD"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="card p-3">
                <p className="text-muted-foreground text-xs mb-1">Balance Sheet (demo)</p>
                <p className="font-semibold">Cash: {formatCurrency(startup.revenue ? startup.revenue * 6 : 300000)}</p>
                <p className="font-semibold">Liabilities: {formatCurrency(startup.burnRate ? startup.burnRate * 3 : 60000)}</p>
              </div>
              <div className="card p-3">
                <p className="text-muted-foreground text-xs mb-1">Growth (demo)</p>
                <p className="font-semibold">{startup.growthPercent ? `${startup.growthPercent}% MoM` : "35% MoM"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold">LOCKED</span>
              <span className="text-sm text-muted-foreground">Swipe right to unlock data room</span>
            </div>
            <Link to="/feed" className="text-primary text-sm font-medium hover:underline">
              Return to feed
            </Link>
          </div>
        )}
      </main>

      {!hideNav && <InvestorNav />}
      
      {startup && (
        <InvestmentModal
          isOpen={showInvestModal}
          onClose={() => setShowInvestModal(false)}
          startup={startup}
          onInvest={handleInvestment}
        />
      )}
    </div>
  );
};

export default StartupDetails;

