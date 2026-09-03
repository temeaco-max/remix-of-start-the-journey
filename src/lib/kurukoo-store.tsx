import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkStage = "understanding" | "working" | "needs_you" | "done";

export type WorkItem = {
  id: string;
  title: string;
  stage: WorkStage;
  detail: string;
  updated: string;
  steps: { label: string; done: boolean }[];
};

export type Message = {
  id: string;
  role: "you" | "kurukoo";
  text: string;
  workId?: string | undefined;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  needsConfirmation: boolean;
  read: boolean;
};

export type Contact = {
  id: string;
  name: string;
  role: string;
  lastTouch: string;
};

export type MemoryNote = {
  id: string;
  label: string;
  value: string;
  source: string;
};

type State = {
  messages: Message[];
  work: WorkItem[];
  notifications: NotificationItem[];
  contacts: Contact[];
  memory: MemoryNote[];
  send: (text: string) => void;
  advance: (id: string) => void;
  confirm: (id: string) => void;
  markRead: (id: string) => void;
};

const KurukooContext = createContext<State | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

function reply(text: string): { answer: string; work?: WorkItem } {
  const t = text.toLowerCase();
  const asks = /find|book|repair|fix|need|get me|order|arrange|call|hire/.test(t);

  if (/what am i waiting for|status|show me what/.test(t)) {
    return { answer: "Here's where everything stands right now — open Work for the full trail." };
  }

  if (asks) {
    const work: WorkItem = {
      id: uid(),
      title: text.replace(/^\s*(please\s+)?/i, "").replace(/\.$/, ""),
      stage: "understanding",
      detail: "Reading your request and lining up who can help.",
      updated: "just now",
      steps: [
        { label: "Understand the request", done: true },
        { label: "Reach suitable people", done: false },
        { label: "Bring back options", done: false },
        { label: "Confirm with you", done: false },
      ],
    };
    return {
      answer: "On it. I'll reach out and come back to you with options before anything is committed.",
      work,
    };
  }

  return {
    answer: "Got it. Tell me what you'd like done and I'll take it from there.",
  };
}

export function KurukooProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [contacts] = useState<Contact[]>([]);
  const [memory, setMemory] = useState<MemoryNote[]>([]);

  const send = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const { answer, work: newWork } = reply(clean);
    setMessages((m) => [
      ...m,
      { id: uid(), role: "you", text: clean },
      { id: uid(), role: "kurukoo", text: answer, workId: newWork?.id },
    ]);
    if (newWork) {
      setWork((w) => [newWork, ...w]);
      setMemory((m) => [
        { id: uid(), label: "Recent request", value: newWork.title, source: "From your conversation" },
        ...m,
      ]);
    }
  }, []);

  const advance = useCallback((id: string) => {
    setWork((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const nextIndex = item.steps.findIndex((s) => !s.done);
        if (nextIndex === -1) return item;
        const steps = item.steps.map((s, i) => (i === nextIndex ? { ...s, done: true } : s));
        const remaining = steps.filter((s) => !s.done).length;
        const stage: WorkStage =
          remaining === 0 ? "done" : remaining === 1 ? "needs_you" : "working";
        return {
          ...item,
          steps,
          stage,
          updated: "just now",
          detail:
            stage === "done"
              ? "Finished. Nothing left for you to do."
              : stage === "needs_you"
                ? "Ready for your confirmation."
                : "Working through it — I'll surface anything that needs you.",
        };
      }),
    );
  }, []);

  const confirm = useCallback((id: string) => {
    setNotifications((n) => n.map((item) => (item.id === id ? { ...item, needsConfirmation: false, read: true } : item)));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((n) => n.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const value = useMemo(
    () => ({ messages, work, notifications, contacts, memory, send, advance, confirm, markRead }),
    [messages, work, notifications, contacts, memory, send, advance, confirm, markRead],
  );

  return <KurukooContext.Provider value={value}>{children}</KurukooContext.Provider>;
}

export function useKurukoo() {
  const ctx = useContext(KurukooContext);
  if (!ctx) throw new Error("useKurukoo must be used inside KurukooProvider");
  return ctx;
}
