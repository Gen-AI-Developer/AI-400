"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Leaf,
  Clock,
  CheckCheck,
  ListTodo,
  LayoutList,
  Server,
  WifiOff,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchTodos,
  createTodo,
  deleteTodo as apiDeleteTodo,
  API_URL,
  type BackendTodo,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority   = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type FilterType = "ALL" | "ACTIVE" | "COMPLETED";
type ApiStatus  = "connecting" | "online" | "offline";

interface LocalMeta {
  completed: boolean;
  priority: Priority;
}

interface Todo {
  id: string;
  backendId: number;
  task: string;
  completed: boolean;
  priority: Priority;
}

// ─── Priority config (earthy tones) ──────────────────────────────────────────

const P = {
  CRITICAL: { label: "Urgent",  color: "var(--color-destructive)", bgClass: "bg-destructive/10", borderClass: "border-destructive/20" },
  HIGH:     { label: "High",    color: "oklch(0.6 0.12 55)",       bgClass: "bg-amber-500/10",    borderClass: "border-amber-500/20" },
  MEDIUM:   { label: "Medium",  color: "var(--color-primary)",     bgClass: "bg-primary/10",      borderClass: "border-primary/20" },
  LOW:      { label: "Low",     color: "oklch(0.6 0.08 150)",      bgClass: "bg-emerald-600/10",  borderClass: "border-emerald-600/20" },
} satisfies Record<Priority, { label: string; color: string; bgClass: string; borderClass: string }>;

const DEFAULT_META: LocalMeta = { completed: false, priority: "MEDIUM" };

// ─── ThemeToggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center transition-colors">
      <div className="mb-1.5 flex justify-center text-muted-foreground">{icon}</div>
      <div
        className="mb-0.5 text-2xl font-bold tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {value}
      </div>
      <div className="text-xs font-medium tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── ApiStatusBadge ───────────────────────────────────────────────────────────

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const cfg = {
    connecting: { dotClass: "bg-amber-500",   labelClass: "text-amber-600 dark:text-amber-400",   label: "Connecting" },
    online:     { dotClass: "bg-emerald-500", labelClass: "text-emerald-600 dark:text-emerald-400", label: "Online" },
    offline:    { dotClass: "bg-red-500",     labelClass: "text-red-600 dark:text-red-400",         label: "Offline" },
  }[status];

  return (
    <div className="flex items-center gap-1.5">
      {status === "connecting" ? (
        <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
      )}
      <span className={cn("text-xs font-medium", cfg.labelClass)}>{cfg.label}</span>
    </div>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-lg border border-border bg-muted/50"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TodoApp() {
  const [backendTodos, setBackendTodos] = useState<BackendTodo[]>([]);
  const [localMeta, setLocalMeta]       = useState<Record<string, LocalMeta>>({});
  const [apiStatus, setApiStatus]       = useState<ApiStatus>("connecting");
  const [loading, setLoading]           = useState(true);
  const [input, setInput]               = useState("");
  const [priority, setPriority]         = useState<Priority>("MEDIUM");
  const [filter, setFilter]             = useState<FilterType>("ALL");
  const [clock, setClock]               = useState("");
  const inputRef                        = useRef<HTMLInputElement>(null);

  // ── Live clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-US", {
          hour12: true, hour: "numeric", minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTodos()
      .then((todos) => {
        setBackendTodos(todos);
        setLocalMeta((prev) => {
          const next = { ...prev };
          todos.forEach((t) => {
            if (!next[String(t.id)]) next[String(t.id)] = { ...DEFAULT_META };
          });
          return next;
        });
        setApiStatus("online");
      })
      .catch(() => setApiStatus("offline"))
      .finally(() => setLoading(false));
  }, []);

  // ── Merge backend + local meta ──────────────────────────────────────────
  const todos: Todo[] = backendTodos.map((bt) => {
    const meta = localMeta[String(bt.id)] ?? DEFAULT_META;
    return { id: String(bt.id), backendId: bt.id, task: bt.task, ...meta };
  });

  const completedCount = todos.filter((t) =>  t.completed).length;
  const activeCount    = todos.filter((t) => !t.completed).length;
  const progress       = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const visible = todos.filter((t) => {
    if (filter === "ACTIVE")    return !t.completed;
    if (filter === "COMPLETED") return  t.completed;
    return true;
  });

  // ── Add todo ──────────────────────────────────────────────────────────────
  const addTodo = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    inputRef.current?.focus();

    try {
      const created = await createTodo(trimmed);
      setBackendTodos((prev) => [created, ...prev]);
      setLocalMeta((prev) => ({
        ...prev,
        [String(created.id)]: { completed: false, priority },
      }));
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }, [input, priority]);

  // ── Toggle completed ──────────────────────────────────────────────────────
  const toggleTodo = (id: string) =>
    setLocalMeta((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_META), completed: !(prev[id]?.completed ?? false) },
    }));

  // ── Delete todo ───────────────────────────────────────────────────────────
  const deleteTodo = async (id: string, backendId: number) => {
    setBackendTodos((prev) => prev.filter((t) => t.id !== backendId));
    setLocalMeta((prev) => { const n = { ...prev }; delete n[id]; return n; });

    try {
      await apiDeleteTodo(backendId);
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background leaf-bg">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2.5">
                <Leaf className="h-5 w-5 text-primary" />
                <h1
                  className="text-2xl font-bold tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  Garden Tasks
                </h1>
              </div>
              <p className="ml-[30px] text-sm text-muted-foreground">
                Tend your to-dos with care
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <ApiStatusBadge status={apiStatus} />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{clock}</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* API URL bar */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Server className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">Backend</span>
            <span className={cn(
              "text-xs font-medium",
              apiStatus === "online" ? "text-emerald-600 dark:text-emerald-400" :
              apiStatus === "offline" ? "text-red-600 dark:text-red-400" :
              "text-amber-600 dark:text-amber-400"
            )}>
              {API_URL}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {apiStatus === "offline" ? "Unreachable" : apiStatus === "connecting" ? "Probing..." : "Connected"}
            </span>
          </div>

          <div className="mt-5 h-px bg-border" />
        </header>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="Total"  value={todos.length}   icon={<LayoutList className="h-4 w-4" />} />
          <StatCard label="Active" value={activeCount}    icon={<ListTodo   className="h-4 w-4" />} />
          <StatCard label="Done"   value={completedCount} icon={<CheckCheck className="h-4 w-4" />} />
        </div>

        {/* ── Progress bar ───────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span
              className="text-sm font-bold text-primary"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Input area ─────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-2 rounded-lg border border-border bg-card p-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="What needs tending?"
            className="flex-1 border-0 bg-transparent text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger
              className="w-[110px] text-xs font-medium"
              style={{ color: P[priority].color }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <SelectItem key={p} value={p} className="text-xs font-medium cursor-pointer" style={{ color: P[p].color }}>
                  {P[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* ── Filter tabs ────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-1">
          {(["ALL", "ACTIVE", "COMPLETED"] as FilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent",
                )}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* ── Todo list ──────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {loading && <LoadingSkeleton />}

          {!loading && apiStatus === "offline" && backendTodos.length === 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 py-12 text-center">
              <WifiOff className="mx-auto mb-3 h-6 w-6 text-destructive/40" />
              <p className="text-sm text-muted-foreground">Backend unreachable</p>
              <p className="mt-1 text-xs text-destructive/60">{API_URL}</p>
            </div>
          )}

          {!loading && !visible.length && (apiStatus !== "offline" || backendTodos.length > 0) && (
            <div className="rounded-lg border border-border bg-card py-16 text-center">
              <Leaf className="mx-auto mb-3 h-8 w-8 text-primary/20" />
              <p className="text-sm text-muted-foreground">
                {filter === "COMPLETED" ? "Nothing completed yet" : filter === "ACTIVE" ? "All done!" : "Plant your first task"}
              </p>
            </div>
          )}

          {!loading && visible.map((todo, idx) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={idx}
              onToggle={toggleTodo}
              onDelete={(id) => deleteTodo(id, todo.backendId)}
            />
          ))}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {!loading && todos.length > 0 && (
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              {activeCount} {activeCount === 1 ? "task" : "tasks"} remaining
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TodoItem ─────────────────────────────────────────────────────────────────

function TodoItem({
  todo, index, onToggle, onDelete,
}: {
  todo: Todo;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const pcfg = P[todo.priority];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/20 animate-fade-in-up",
        `delay-${Math.min(index, 9)}`,
        todo.completed && "opacity-60",
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          todo.completed
            ? "border-primary bg-primary/15"
            : "border-muted-foreground/30 hover:border-primary/60",
        )}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && (
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Task text */}
      <span
        className={cn(
          "flex-1 text-sm transition-colors",
          todo.completed ? "line-through text-muted-foreground" : "text-foreground",
        )}
      >
        {todo.task}
      </span>

      {/* Backend ID */}
      <span className="flex-shrink-0 text-[10px] text-muted-foreground/40">
        #{todo.backendId}
      </span>

      {/* Priority badge */}
      <span
        className={cn(
          "flex-shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium",
          pcfg.bgClass,
          pcfg.borderClass,
        )}
        style={{ color: pcfg.color }}
      >
        {pcfg.label}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
