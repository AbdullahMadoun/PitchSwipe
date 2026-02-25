import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FounderNav } from "@/components/layout/FounderNav";
import { Button } from "@/components/ui/button";

const mockInvestors = [
  { id: "1", name: "Jane Investor", time: "2h ago", hasChat: false },
  { id: "2", name: "Bob Kim", time: "1d ago", hasChat: false },
  { id: "3", name: "Sarah Lee", time: "3d ago", hasChat: true },
  { id: "4", name: "Mike Johnson", time: "5d ago", hasChat: false },
  { id: "5", name: "Emily Chen", time: "1w ago", hasChat: true },
];

const FounderInterested = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Interested Investors</h1>
      </div>

      <div className="flex-1 p-6">
        <p className="text-sm text-muted-foreground mb-6">
          {mockInvestors.length} investors showed interest in your startup
        </p>

        <div className="space-y-3">
          {mockInvestors.map((investor, index) => (
            <motion.div
              key={investor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">{investor.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{investor.name}</p>
                    <p className="text-xs text-muted-foreground">Interested {investor.time}</p>
                  </div>
                </div>
                {investor.hasChat ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Active chat</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/founder/messages")}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <FounderNav />
    </div>
  );
};

export default FounderInterested;
