'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Wand2, Compass, CheckCircle2, Plus, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { personaPresets } from "@/lib/presets";
import type { AssistantProfile, AssistantTask } from "@/types/assistant";

const starterTasks: AssistantTask[] = [
  { id: "task-1", title: "Review calendar for the morning", done: true },
  { id: "task-2", title: "Draft update for product sync", done: false },
  { id: "task-3", title: "Integrate movement + hydration breaks", done: false },
];

const quickPrompts = [
  "Help me re-prioritize my focus for the next 2 hours.",
  "Give me a calm check-in ritual for tonight.",
  "What should I delegate or say no to this week?",
  "Turn my notes into a short status update.",
];

const defaultProfile: AssistantProfile = {
  name: "You",
  focus: "Balancing deep work with wellbeing",
  mood: "Curious, a bit stretched thin",
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const createMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role !== "user";
  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-2xl rounded-3xl px-5 py-4 shadow-sm transition ${
          isAssistant
            ? "bg-slate-900/60 text-slate-100 ring-1 ring-slate-700/80"
            : "bg-white text-slate-900 ring-1 ring-slate-200"
        }`}
      >
        <div className="prose prose-invert max-w-none text-[15px] leading-relaxed prose-p:my-2 prose-ul:my-2 prose-li:marker:text-slate-400 prose-strong:text-slate-100 prose-a:text-sky-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function PersonaBadge({
  personaId,
  activeId,
  onSelect,
}: {
  personaId: string;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const persona = personaPresets.find((item) => item.id === personaId);
  if (!persona) return null;

  const isActive = persona.id === activeId;

  return (
    <button
      onClick={() => onSelect(persona.id)}
      className={`group relative flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition ${
        isActive
          ? "border-transparent bg-gradient-to-br from-white/20 via-white/10 to-white/5 text-white shadow-lg shadow-slate-900/30"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-slate-300/80">
        <Wand2 size={16} /> {persona.name}
      </span>
      <p className="text-sm text-slate-200/90">{persona.tagline}</p>
      <div
        className={`pointer-events-none absolute inset-0 -z-[1] rounded-2xl bg-gradient-to-tr opacity-0 transition group-hover:opacity-50 ${
          persona.gradient
        } ${isActive ? "opacity-70" : ""}`}
      />
    </button>
  );
}

function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
        <Compass size={16} />
        {title}
      </h3>
      <div className="space-y-2 text-sm text-slate-200/80">{children}</div>
    </div>
  );
}

export default function Home() {
  const [personaId, setPersonaId] = useState(personaPresets[0].id);
  const [tasks, setTasks] = useState<AssistantTask[]>(starterTasks);
  const [profile, setProfile] = useState<AssistantProfile>(defaultProfile);
  const [notes, setNotes] = useState("");
  const activePersona = useMemo(
    () => personaPresets.find((persona) => persona.id === personaId) ?? personaPresets[0],
    [personaId]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: prompt.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          personaId,
          instructions: notes,
          profile,
          tasks,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Assistant returned an error.");
      }

      const data = (await response.json()) as { reply?: string };
      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content:
          data.reply ??
          "I couldn't generate a response right now, but I'm still here if you want to try again.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error", error);
      setError("The assistant hit a snag. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    void sendMessage(prompt);
  };

  const handleAddTask = () => {
    const title = window.prompt("What's the micro-goal you want to track?");
    if (!title) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `task-${prev.length + 1}`,
        title: title.trim(),
        done: false,
      },
    ]);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(76,29,149,0.18),_transparent_55%)]" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-10 pt-12 lg:flex-row lg:gap-8 lg:px-10">
        <section className="flex w-full flex-col gap-5 lg:w-[22rem]">
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/5 p-6 shadow-2xl shadow-black/30">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-200/10 via-transparent to-slate-900/40" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-200/80">Agentic</p>
                <h1 className="text-xl font-semibold text-white">Personal AI Companion</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-200/80">
              Craft your own AI partner for planning, focus, and wellbeing. Blend structure with
              reflection to stay grounded and moving forward.
            </p>
          </header>

          <div className="flex flex-col gap-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-300/90">Persona modes</h2>
            <div className="grid gap-3">
              {personaPresets.map((persona) => (
                <PersonaBadge
                  key={persona.id}
                  personaId={persona.id}
                  activeId={personaId}
                  onSelect={setPersonaId}
                />
              ))}
            </div>
          </div>

          <InsightCard title="Focus inputs">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Primary aim</span>
                <input
                  value={profile.focus ?? ""}
                  onChange={(event) => setProfile((prev) => ({ ...prev, focus: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
                  placeholder="Design a calm, focused morning flow"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Current vibe</span>
                <input
                  value={profile.mood ?? ""}
                  onChange={(event) => setProfile((prev) => ({ ...prev, mood: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
                  placeholder="Feeling a bit scattered but hopeful"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Personal hints</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-1 min-h-[96px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition focus:border-white/40"
                  placeholder="Notes, rituals, triggers, or context you want the assistant to remember."
                />
              </label>
            </div>
          </InsightCard>

          <InsightCard title="Today’s commitments">
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                      task.done
                        ? "border-emerald-300/50 bg-emerald-500/10 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <CheckCircle2
                      size={18}
                      className={`transition ${task.done ? "text-emerald-300" : "text-slate-400"}`}
                    />
                    <span className="text-sm">{task.title}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleAddTask}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 transition hover:text-white"
            >
              <Plus size={16} /> Add micro-goal
            </button>
          </InsightCard>

          <InsightCard title="Suggestions">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-slate-100 transition hover:border-white/40 hover:bg-white/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </InsightCard>
        </section>

        <section className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-lg">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Live session</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{activePersona.name} is tuned in</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Active
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {messages.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-sm text-slate-200/70">
                <p className="font-medium text-slate-100/90">
                  Start a conversation to unlock tailored planning, creative momentum, and grounded
                  wellbeing check-ins.
                </p>
                <p className="mt-2 text-slate-400">
                  Share how you&apos;re feeling, what&apos;s on your plate, or drop a voice of your goals.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-slate-200" />
                Synthesizing next steps...
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 px-6 py-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner shadow-black/20">
              <textarea
                name="message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Ask for support, share context, or let your assistant know what's shifting..."
                className="w-full resize-none rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/40"
              />
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/15 px-3 py-1 uppercase tracking-[0.25em]">
                    Shift + Enter for newline
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInput("Can you create a momentum plan for the next 90 minutes?");
                    }}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] transition hover:border-white/40 hover:text-white"
                  >
                    Momentum plan
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-slate-500"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                  {isLoading ? "Working" : "Send"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>
      <footer className="px-6 pb-8 text-center text-xs text-slate-400/80">
        Built with care — supply an `OPENAI_API_KEY` environment variable before chatting in production.
      </footer>
    </div>
  );
}
