import { mockStartups } from "./mock-data";
import { addUnlockedId } from "./data-store";

export interface ChatMessage {
  id: string;
  sender: "investor" | "founder";
  text: string;
  timestamp: number;
}

export interface ChatThread {
  id: string;
  startupId: string;
  messages: ChatMessage[];
  unread: boolean;
}

const CHAT_KEY = "pitchswipe-chats";

const safeParse = <T>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const loadThreads = (): ChatThread[] => {
  if (typeof window === "undefined") return [];
  return safeParse<ChatThread[]>(localStorage.getItem(CHAT_KEY), []);
};

const saveThreads = (threads: ChatThread[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(threads));
};

// Seed with a couple of mock threads for the demo
export const ensureSeedThreads = () => {
  if (loadThreads().length > 0) return;
  const seeds: ChatThread[] = mockStartups.slice(0, 2).map((startup, idx) => ({
    id: `seed-${idx + 1}`,
    startupId: startup.id,
    unread: idx === 0,
    messages: [
      {
        id: crypto.randomUUID(),
        sender: "founder",
        text: "Thanks for your interest! Would love to schedule a call.",
        timestamp: Date.now() - 1000 * 60 * 60 * (idx + 1),
      },
      {
        id: crypto.randomUUID(),
        sender: "investor",
        text: "Looks great. Can you share the deck?",
        timestamp: Date.now() - 1000 * 60 * 30 * (idx + 1),
      },
    ],
  }));
  saveThreads(seeds);
};

export const getThreads = (): ChatThread[] => {
  ensureSeedThreads();
  return loadThreads();
};

export const getThreadById = (id: string): ChatThread | undefined => {
  return getThreads().find((t) => t.id === id);
};

export const appendMessage = (threadId: string, message: ChatMessage) => {
  const threads = getThreads();
  const updated = threads.map((t) =>
    t.id === threadId
      ? { ...t, messages: [...t.messages, message], unread: false }
      : t
  );
  saveThreads(updated);
};

export const markThreadRead = (threadId: string) => {
  const threads = getThreads();
  const updated = threads.map((t) =>
    t.id === threadId ? { ...t, unread: false } : t
  );
  saveThreads(updated);
};

export const ensureThreadForStartup = (startupId: string) => {
  const threads = getThreads();
  const existing = threads.find((t) => t.startupId === startupId);
  if (existing) return existing.id;

  const newThread: ChatThread = {
    id: crypto.randomUUID(),
    startupId,
    unread: true,
    messages: [
      {
        id: crypto.randomUUID(),
        sender: "founder",
        text: "Thanks for unlocking us! Happy to answer any questions.",
        timestamp: Date.now(),
      },
    ],
  };
  saveThreads([...threads, newThread]);
  addUnlockedId(startupId);
  return newThread.id;
};

// Alias for compatibility
export const createThread = ensureThreadForStartup;

