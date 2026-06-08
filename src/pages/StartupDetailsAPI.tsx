import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { saveStartupId, addInvestedId, addUnlockedId, getUnlockedIds } from "@/lib/data-store";
import { cn } from "@/lib/utils";
import { Bookmark, MessageCircle, DollarSign, TrendingUp, Users, Calendar, Zap, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InvestmentModal } from "@/components/InvestmentModal";
import { createThread, appendMessage } from "@/lib/chat-store";
import { apiClient } from "@/lib/api";

interface Props {
  startupIdOverride?: string;
  forceUnlocked?: boolean;
  hideNav?: boolean;
}

// Helper to format currency in SAR
const formatCurrency = (amount: number) => {
  return `SAR ${amount.toLocaleString()}`;
};

// Stage colors mapping
const stageColors: Record<string, string> = {
  "Pre-Seed": "bg-purple-100 text-purple-700",
  "Seed": "bg-blue-100 text-blue-700",
  "Series A": "bg-green-100 text-green-700",
  "Series B": "bg-orange-100 text-orange-700",
  "Series B+": "bg-red-100 text-red-700",
};

const StartupDetailsAPI = ({ startupIdOverride, forceUnlocked, hideNav }: Props) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const effectiveId = startupIdOverride || id;
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const unlocked = new Set(getUnlockedIds());

  useEffect(() => {
    const fetchStartupDetails = async () => {
      if (!effectiveId) return;
      
      try {
        setLoading(true);
        const data = await apiClient.getCompanyDetails(effectiveId);
        
        // Transform backend data to match frontend format
        const transformedStartup = {
          id: data.id,
          name: data.name,
          tagline: data.tagline,
          videoUrl: data.video_url,
          videoPoster: data.logo_url || `https://via.placeholder.com/400x600/10B981/ffffff?text=${encodeURIComponent(data.name)}`,
          industry: data.industry,
          stage: data.stage,
          raiseAmount: data.raise_amount,
          valuation: data.valuation,
          equityPercent: data.equity_percent,
          minTicket: data.min_ticket,
          founderName: data.founder_name || data.founders?.[0] || "Founder",
          founderAvatar: data.founder_image || `https://via.placeholder.com/100x100/059669/ffffff?text=${encodeURIComponent((data.founder_name || "F").substring(0, 2))}`,
          tags: [data.industry, data.stage, ...(data.tags || [])],
          description: data.description,
          revenue: data.revenue || data.monthly_revenue,
          burnRate: data.burn_rate,
          runwayMonths: data.runway_months,
          growthPercent: data.growth_percent,
          leadInvestor: data.lead_investor,
          // Additional financial data
          totalFunding: data.total_funding,
          employees: data.employees,
          founded: data.founded,
          revenueRunRate: data.revenue_run_rate,
          netRevenueRetention: data.net_revenue_retention,
          cac: data.cac,
          ltvCacRatio: data.ltv_cac_ratio,
          grossMargin: data.gross_margin,
          transcript: data.transcript
        };
        
        setStartup(transformedStartup);
      } catch (error) {
        console.error("Failed to fetch startup details:", error);
        toast({
          title: "Error",
          description: "Failed to load startup details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStartupDetails();
  }, [effectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        {!hideNav && <InvestorNav />}
      </div>
    );
  }

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
        {/* Video Section */}
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

        {/* Stage and Industry */}
        <div className="flex items-center gap-2">
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", stageColors[startup.stage] || "bg-gray-100 text-gray-700")}>
            {startup.stage}
          </span>
          <span className="text-sm text-muted-foreground">{startup.industry}</span>
          {startup.founded && (
            <span className="text-sm text-muted-foreground">• Founded {startup.founded}</span>
          )}
        </div>

        <p className="text-lg font-semibold text-foreground">{startup.tagline}</p>

        {/* Action Buttons (only if unlocked) */}
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

        {/* Key Metrics Grid */}
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

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {startup.tags.slice(0, 5).map((tag: string) => (
            <span key={tag} className="badge-industry">#{tag}</span>
          ))}
        </div>

        {/* Description */}
        <div className="card p-4">
          <h3 className="font-semibold text-foreground mb-2">Description</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{startup.description}</p>
        </div>

        {/* Team Info */}
        {startup.employees && (
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Employees</p>
                <p className="font-semibold">{startup.employees}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Founded</p>
                <p className="font-semibold">{startup.founded || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Details (Only if Unlocked) */}
        {isUnlocked ? (
          <>
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">UNLOCKED</span>
                <span className="text-sm text-muted-foreground">Full data room access</span>
              </div>
              
              {/* Core Financials */}
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Financial Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="card p-3">
                  <p className="text-muted-foreground text-xs mb-1">Monthly Revenue</p>
                  <p className="font-semibold">{startup.revenue ? formatCurrency(startup.revenue) : "Pre-revenue"}</p>
                </div>
                <div className="card p-3">
                  <p className="text-muted-foreground text-xs mb-1">Burn Rate</p>
                  <p className="font-semibold">{startup.burnRate ? formatCurrency(startup.burnRate) + "/mo" : "N/A"}</p>
                </div>
                <div className="card p-3">
                  <p className="text-muted-foreground text-xs mb-1">Runway</p>
                  <p className="font-semibold">{startup.runwayMonths ? `${startup.runwayMonths} months` : "N/A"}</p>
                </div>
                <div className="card p-3">
                  <p className="text-muted-foreground text-xs mb-1">Growth Rate</p>
                  <p className="font-semibold">{startup.growthPercent ? `${startup.growthPercent}% MoM` : "N/A"}</p>
                </div>
              </div>

              {/* Advanced Metrics */}
              {(startup.revenueRunRate || startup.grossMargin) && (
                <>
                  <h4 className="font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Unit Economics
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {startup.revenueRunRate && (
                      <div className="card p-3">
                        <p className="text-muted-foreground text-xs mb-1">ARR</p>
                        <p className="font-semibold">{formatCurrency(startup.revenueRunRate)}</p>
                      </div>
                    )}
                    {startup.grossMargin !== undefined && (
                      <div className="card p-3">
                        <p className="text-muted-foreground text-xs mb-1">Gross Margin</p>
                        <p className="font-semibold">{startup.grossMargin}%</p>
                      </div>
                    )}
                    {startup.cac && (
                      <div className="card p-3">
                        <p className="text-muted-foreground text-xs mb-1">CAC</p>
                        <p className="font-semibold">{formatCurrency(startup.cac)}</p>
                      </div>
                    )}
                    {startup.ltvCacRatio && (
                      <div className="card p-3">
                        <p className="text-muted-foreground text-xs mb-1">LTV/CAC</p>
                        <p className="font-semibold">{startup.ltvCacRatio}x</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Funding Information */}
              <h4 className="font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Funding Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="card p-3">
                  <p className="text-muted-foreground text-xs mb-1">Lead Investor</p>
                  <p className="font-semibold">{startup.leadInvestor || "Open"}</p>
                </div>
                <div className="card p-3">
                  <p className="text-muted-foreground text-xs mb-1">Total Raised</p>
                  <p className="font-semibold">{startup.totalFunding ? formatCurrency(startup.totalFunding) : formatCurrency(startup.raiseAmount)}</p>
                </div>
              </div>
            </div>

            {/* Pitch Transcript (if available) */}
            {startup.transcript && (
              <div className="card p-4">
                <h3 className="font-semibold text-foreground mb-2">Pitch Transcript</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {startup.transcript}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold">LOCKED</span>
              <span className="text-sm text-muted-foreground">Swipe right to unlock full data room</span>
            </div>
            <Link to="/test" className="text-primary text-sm font-medium hover:underline">
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

export default StartupDetailsAPI;