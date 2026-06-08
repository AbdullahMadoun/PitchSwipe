import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FounderNav } from "@/components/layout/FounderNav";
import { getThreads } from "@/lib/chat-store";
import { MessageCircle, DollarSign } from "lucide-react";

const FounderMessages = () => {
  const threads = getThreads();
  
  // For demo, we'll show all threads as if they're for the founder's startup
  // In a real app, you'd filter by the founder's specific startup ID
  
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Messages</h1>
      </div>

      <div className="flex-1 p-4">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start chatting with interested investors
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread, index) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              const hasBidRequest = thread.messages.some(msg => 
                msg.text.includes("💰 Investment Bid Request") && msg.sender === "investor"
              );
              
              return (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/founder/messages/${thread.id}`}
                    className="block card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">IN</span>
                        </div>
                        {thread.unread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">Interested Investor</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lastMessage?.timestamp || Date.now()).toLocaleTimeString([], { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {lastMessage?.text.substring(0, 50)}...
                        </p>
                        {hasBidRequest && (
                          <span className="inline-flex items-center gap-1 mt-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            <DollarSign className="w-3 h-3" />
                            Has bid request
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <FounderNav />
    </div>
  );
};

export default FounderMessages;