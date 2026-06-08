import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { getAllStartups, getUnlockedIds } from "@/lib/data-store";
import { getThreads } from "@/lib/chat-store";

const Messages = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Messages" />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        {getThreads().filter((t) => new Set(getUnlockedIds()).has(t.startupId)).length > 0 ? (
          <div className="space-y-2">
            {getThreads().filter((t) => new Set(getUnlockedIds()).has(t.startupId)).map((thread, index) => {
              const startup = getAllStartups().find((s) => s.id === thread.startupId);
              if (!startup) return null;
              const last = thread.messages[thread.messages.length - 1];
              return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/messages/${thread.id}`}
                  className="block card-base p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={startup.founderAvatar}
                        alt={startup.founderName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {thread.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-foreground truncate">
                          {startup.name}
                        </h3>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {new Date(last?.timestamp ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {startup.founderName}
                      </p>
                      <p className={`text-sm truncate mt-1 ${thread.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {last?.text ?? "Tap to open chat"}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No messages yet</h2>
            <p className="text-muted-foreground mb-6">
              Swipe right to unlock a startup before chatting with founders.
            </p>
            <Link to="/feed" className="btn-primary inline-flex">
              Discover Startups
            </Link>
          </motion.div>
        )}
      </main>

      <InvestorNav />
    </div>
  );
};

export default Messages;
