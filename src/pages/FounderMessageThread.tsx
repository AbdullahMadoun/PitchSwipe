import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { FounderNav } from "@/components/layout/FounderNav";
import { getThreadById, appendMessage, markThreadRead } from "@/lib/chat-store";
import { getAllStartups, addInvestedId } from "@/lib/data-store";
import { BidResponseModal } from "@/components/BidResponseModal";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/mock-data";

interface BidInfo {
  messageId: string;
  numTickets: number;
  pricePerTicket: number;
  totalAmount: number;
  status?: "pending" | "accepted" | "rejected" | "countered";
}

const FounderMessageThread = () => {
  const { id } = useParams<{ id: string }>();
  const [input, setInput] = useState("");
  const [showBidModal, setShowBidModal] = useState(false);
  const [currentBid, setCurrentBid] = useState<BidInfo | null>(null);
  const [bidStatuses, setBidStatuses] = useState<Record<string, string>>({});
  
  const thread = useMemo(() => (id ? getThreadById(id) : undefined), [id]);

  const startup = useMemo(() => {
    if (!thread) return undefined;
    return getAllStartups().find((s) => s.id === thread.startupId);
  }, [thread]);

  useEffect(() => {
    if (thread) markThreadRead(thread.id);
  }, [thread]);

  // Parse bid request from message text
  const parseBidFromMessage = (text: string, messageId: string): BidInfo | null => {
    if (!text.includes("💰 Investment Bid Request")) return null;
    
    const ticketsMatch = text.match(/Number of tickets: (\d+)/);
    const priceMatch = text.match(/Price per ticket: \$([0-9,]+)/);
    const totalMatch = text.match(/Total investment: \$([0-9,]+)/);
    
    if (ticketsMatch && priceMatch && totalMatch) {
      return {
        messageId,
        numTickets: parseInt(ticketsMatch[1]),
        pricePerTicket: parseFloat(priceMatch[1].replace(/,/g, '')),
        totalAmount: parseFloat(totalMatch[1].replace(/,/g, '')),
        status: bidStatuses[messageId] as any || "pending"
      };
    }
    return null;
  };

  const handleBidClick = (msg: any) => {
    const bidInfo = parseBidFromMessage(msg.text, msg.id);
    if (bidInfo && startup) {
      setCurrentBid(bidInfo);
      setShowBidModal(true);
    }
  };

  const handleAcceptBid = () => {
    if (!currentBid || !thread || !startup) return;
    
    // Update bid status
    setBidStatuses(prev => ({ ...prev, [currentBid.messageId]: "accepted" }));
    
    // Add investment to investor's portfolio
    addInvestedId(startup.id);
    
    // Send acceptance message
    const acceptMessage = {
      id: crypto.randomUUID(),
      sender: "founder" as const,
      text: `✅ Bid Accepted!\n\nI'm happy to accept your investment of ${formatCurrency(currentBid.totalAmount)} (${currentBid.numTickets} tickets at ${formatCurrency(currentBid.pricePerTicket)} each).\n\nThe investment has been confirmed and added to your portfolio. Welcome aboard! 🚀`,
      timestamp: Date.now(),
    };
    
    appendMessage(thread.id, acceptMessage);
    setShowBidModal(false);
    
    toast({
      title: "✅ Bid Accepted",
      description: "The investor has been notified and the investment is confirmed",
    });
  };

  const handleRejectBid = (reason?: string) => {
    if (!currentBid || !thread) return;
    
    // Update bid status
    setBidStatuses(prev => ({ ...prev, [currentBid.messageId]: "rejected" }));
    
    // Send rejection message
    const rejectMessage = {
      id: crypto.randomUUID(),
      sender: "founder" as const,
      text: `❌ Bid Declined\n\nThank you for your interest, but I cannot accept the bid at ${formatCurrency(currentBid.pricePerTicket)} per ticket.${reason ? `\n\nReason: ${reason}` : ''}\n\nFeel free to make another offer or let's discuss further.`,
      timestamp: Date.now(),
    };
    
    appendMessage(thread.id, rejectMessage);
    setShowBidModal(false);
    
    toast({
      title: "Bid Declined",
      description: "The investor has been notified",
    });
  };

  const handleCounterBid = (newPrice: number, message?: string) => {
    if (!currentBid || !thread || !startup) return;
    
    // Update bid status
    setBidStatuses(prev => ({ ...prev, [currentBid.messageId]: "countered" }));
    
    const newTotal = newPrice * currentBid.numTickets;
    
    // Send counter offer message
    const counterMessage = {
      id: crypto.randomUUID(),
      sender: "founder" as const,
      text: `🔄 Counter Offer\n\nI appreciate your interest! I'd like to propose:\n• ${currentBid.numTickets} tickets at ${formatCurrency(newPrice)} each\n• Total investment: ${formatCurrency(newTotal)}${message ? `\n\n${message}` : ''}\n\nThis is closer to our minimum ticket price of ${formatCurrency(startup.minTicket)}. What do you think?`,
      timestamp: Date.now(),
    };
    
    appendMessage(thread.id, counterMessage);
    setShowBidModal(false);
    
    toast({
      title: "🔄 Counter Offer Sent",
      description: "Your counter offer has been sent to the investor",
    });
  };

  const handleSend = () => {
    if (!thread || !input.trim()) return;
    appendMessage(thread.id, {
      id: crypto.randomUUID(),
      sender: "founder",
      text: input.trim(),
      timestamp: Date.now(),
    });
    setInput("");
  };

  if (!thread || !startup) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Messages" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-muted-foreground mb-4">Thread not found.</p>
          <Link to="/founder/messages" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to inbox
          </Link>
        </div>
        <FounderNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <Header title="Chat with Investor" />

      <main className="pt-20 px-4 flex-1 flex flex-col max-w-lg w-full mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold">IN</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">Interested Investor</p>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {thread.messages.map((msg) => {
            const bidInfo = parseBidFromMessage(msg.text, msg.id);
            const isBidMessage = bidInfo !== null;
            const bidStatus = bidStatuses[msg.id];
            
            return (
              <div key={msg.id}>
                <div className={`flex ${msg.sender === "founder" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm ${
                      msg.sender === "founder"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[10px] mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                
                {isBidMessage && msg.sender === "investor" && (
                  <div className="flex justify-start mt-2 ml-2">
                    {bidStatus === "accepted" ? (
                      <div className="text-xs text-green-600 font-medium">
                        ✅ Bid Accepted
                      </div>
                    ) : bidStatus === "rejected" ? (
                      <div className="text-xs text-red-600 font-medium">
                        ❌ Bid Declined
                      </div>
                    ) : bidStatus === "countered" ? (
                      <div className="text-xs text-amber-600 font-medium">
                        🔄 Counter Offered
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBidClick(msg)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-full hover:bg-primary-hover transition-colors flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        Review Bid
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            className="rounded-full bg-primary text-primary-foreground p-3 hover:bg-primary-hover transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </main>

      <FounderNav />

      {currentBid && startup && (
        <BidResponseModal
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          bidDetails={{
            investorName: "Interested Investor",
            numTickets: currentBid.numTickets,
            pricePerTicket: currentBid.pricePerTicket,
            totalAmount: currentBid.totalAmount,
            originalMinTicket: startup.minTicket,
            messageId: currentBid.messageId,
            threadId: thread?.id || "",
          }}
          onAccept={handleAcceptBid}
          onReject={handleRejectBid}
          onCounter={handleCounterBid}
        />
      )}
    </div>
  );
};

export default FounderMessageThread;