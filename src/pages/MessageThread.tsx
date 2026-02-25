import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { getThreadById, appendMessage, markThreadRead } from "@/lib/chat-store";
import { getAllStartups, getUnlockedIds } from "@/lib/data-store";

const MessageThread = () => {
  const { id } = useParams<{ id: string }>();
  const [input, setInput] = useState("");
  const thread = useMemo(() => (id ? getThreadById(id) : undefined), [id]);

  const startup = useMemo(() => {
    if (!thread) return undefined;
    return getAllStartups().find((s) => s.id === thread.startupId);
  }, [thread]);

  const unlocked = useMemo(() => new Set(getUnlockedIds()), []);

  useEffect(() => {
    if (thread) markThreadRead(thread.id);
  }, [thread]);

  const handleSend = () => {
    if (!thread || !input.trim()) return;
    appendMessage(thread.id, {
      id: crypto.randomUUID(),
      sender: "investor",
      text: input.trim(),
      timestamp: Date.now(),
    });
    setInput("");
  };

  if (!thread || !startup || !unlocked.has(startup.id)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Messages" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-muted-foreground mb-4">Chat is only available after you swipe right to unlock this startup.</p>
          <Link to="/messages" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to inbox
          </Link>
        </div>
        <InvestorNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <Header title={startup.name} />

      <main className="pt-20 px-4 flex-1 flex flex-col max-w-lg w-full mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={startup.founderAvatar}
            alt={startup.founderName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-foreground">{startup.founderName}</p>
            <p className="text-sm text-muted-foreground">{startup.stage} · {startup.industry}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {thread.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "investor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm ${
                  msg.sender === "investor"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <p>{msg.text}</p>
                <span className="block text-[10px] text-white/80 mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
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

      <InvestorNav />
    </div>
  );
};

export default MessageThread;

