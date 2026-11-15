"use client";

import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ListFilter,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TaskStatus = "in_progress" | "completed";
type Priority = "low" | "medium" | "high";
type Task = {
  _id: string;
  title: string;
  description?: string;
  dueAt: string;
  endAt?: string;
  priority: Priority;
  status: TaskStatus;
};
type Draft = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: Priority;
};
type Week = { key: string; start: Date; end: Date; tasks: Task[] };

const API_URL = "/api";
const emptyDraft = (): Draft => ({ title: "", description: "", date: "", startTime: "", endTime: "", priority: "medium" });
const userError = (reason: unknown, fallback: string) =>
  reason instanceof TypeError
    ? "Can't reach the task API. Check that the app is running."
    : reason instanceof Error ? reason.message : fallback;

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekLabel(start: Date, end: Date) {
  const month = new Intl.DateTimeFormat("en", { month: "short" });
  if (start.getMonth() === end.getMonth()) return `${month.format(start)} ${start.getDate()} – ${end.getDate()}`;
  return `${month.format(start)} ${start.getDate()} – ${month.format(end)} ${end.getDate()}`;
}

function dateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function displayTime(date: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

function displayTimeRange(task: Task) {
  const start = new Date(task.dueAt);
  const end = task.endAt ? new Date(task.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
  return `${displayTime(task.dueAt)} – ${displayTime(end.toISOString())}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const [showWholeWeek, setShowWholeWeek] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load tasks.");
      setTasks(data.tasks);
      setError("");
    } catch (reason) {
      setError(userError(reason, "Could not connect to the task service."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const weeks = useMemo<Week[]>(() => {
    const grouped = new Map<string, Week>();
    const thisMonday = startOfWeek(new Date());
    const ensureWeek = (start: Date) => {
      const key = dayKey(start);
      if (!grouped.has(key)) {
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        grouped.set(key, { key, start, end, tasks: [] });
      }
      return grouped.get(key)!;
    };
    ensureWeek(thisMonday);
    if (selectedWeek) ensureWeek(new Date(`${selectedWeek}T00:00:00`));
    tasks.forEach((task) => ensureWeek(startOfWeek(new Date(task.dueAt))).tasks.push(task));
    return [...grouped.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks, selectedWeek]);

  const activeWeekKey = selectedWeek || dayKey(startOfWeek(new Date()));
  const activeWeek = weeks.find((week) => week.key === activeWeekKey) || weeks[0];
  const allCount = tasks.length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const filteredTasks = useMemo(() => {
    const weekTasks = query.trim() ? tasks : activeWeek?.tasks || [];
    return weekTasks
      .filter((task) => !query.trim() || `${task.title} ${task.description || ""}`.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((task) => query.trim() || showWholeWeek || dayKey(new Date(task.dueAt)) === selectedDay)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [activeWeek, query, selectedDay, showWholeWeek, tasks]);

  const weekOpen = activeWeek?.tasks.filter((task) => task.status !== "completed").length || 0;
  const weekDone = activeWeek?.tasks.filter((task) => task.status === "completed").length || 0;
  const weekTotal = weekOpen + weekDone;
  const progress = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  function openCreate() {
    const now = new Date();
    const defaultDate = selectedDay || dateInputValue(now);
    setEditing(null);
    setDraft({ ...emptyDraft(), date: defaultDate, startTime: "09:00", endTime: "10:00" });
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    const start = new Date(task.dueAt);
    const end = task.endAt ? new Date(task.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description || "",
      date: dateInputValue(start),
      startTime: timeInputValue(start),
      endTime: timeInputValue(end),
      priority: task.priority,
    });
    setModalOpen(true);
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const startAt = new Date(`${draft.date}T${draft.startTime}`);
      const endAt = new Date(`${draft.date}T${draft.endTime}`);
      if (endAt <= startAt) throw new Error("End time must be after start time.");
      const response = await fetch(`${API_URL}/tasks${editing ? `/${editing._id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.title, description: draft.description, dueAt: startAt.toISOString(), endAt: endAt.toISOString(), priority: draft.priority }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this task.");
      setModalOpen(false);
      await loadTasks();
    } catch (reason) {
      setError(userError(reason, "Could not save this task."));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(task: Task) {
    try {
      const response = await fetch(`${API_URL}/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: task.status === "completed" ? "in_progress" : "completed" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update task status.");
      setTasks((current) => current.map((item) => item._id === task._id ? data.task : item));
    } catch (reason) {
      setError(userError(reason, "Could not update task status."));
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      const response = await fetch(`${API_URL}/tasks/${task._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete task.");
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (reason) {
      setError(userError(reason, "Could not delete task."));
    }
  }

  const days = activeWeek
    ? Array.from({ length: 7 }, (_, index) => {
        const date = new Date(activeWeek.start);
        date.setDate(date.getDate() + index);
        return date;
      })
    : [];

  function goToToday() {
      const today = new Date();
      setSelectedWeek(dayKey(startOfWeek(today)));
      setSelectedDay(dayKey(today));
      setShowWholeWeek(false);
      setQuery("");
  }

  function moveWeek(offset: number) {
    if (!activeWeek) return;
    const start = new Date(activeWeek.start);
    start.setDate(start.getDate() + offset * 7);
    const key = dayKey(start);
    setSelectedWeek(key);
    setSelectedDay(key);
    setShowWholeWeek(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Todo home">
          <span className="brand-mark"><CheckCheck size={19} strokeWidth={2.5} /></span>
          <span>todo<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <button className="nav-item nav-active"><CalendarDays size={18} /> My week</button>
        <button className="nav-item" onClick={goToToday}>
          <Circle size={18} /> Today
          <span className="nav-count">{tasks.filter((task) => dayKey(new Date(task.dueAt)) === dayKey(new Date())).length}</span>
        </button>
        <div className="sidebar-divider" />
        <div className="sidebar-label">YOUR PROGRESS</div>
        <div className="sidebar-progress">
          <div className="progress-ring" style={{ background: `conic-gradient(var(--blue) ${progress}%, #e8eaff 0)` }}><span>{progress}%</span></div>
          <div><strong>Nice momentum</strong><small>{completedCount} of {allCount} tasks done</small></div>
        </div>
        <div className="sidebar-note">
          <Sparkles size={17} />
          <p>Small steps add up. Keep showing up for your goals.</p>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">D</div>
          <div><strong>Your workspace</strong><small>Personal planner</small></div>
          <Settings2 size={17} className="profile-settings" />
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <button className="icon-button settings-button" aria-label="Settings"><Settings2 size={19} /></button>
          <a className="mobile-brand" href="#" aria-label="Todo home">todo<span className="brand-period">.</span></a>
          <div className="topbar-actions">
            <button className="icon-button header-search-button" aria-label="Search tasks" onClick={() => searchInputRef.current?.focus()}><Search size={19} /></button>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><i /></button>
          </div>
        </header>

        <div className="content-wrap">
          <label className="search-box home-search">
            <Search size={17} />
            <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for a task" aria-label="Search tasks" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}
          </label>

          {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}

          <section className="week-heading">
            <div>
              <div className="section-title-row"><h2>{activeWeek ? weekLabel(activeWeek.start, activeWeek.end) : "This week"}</h2></div>
            </div>
            <div className="week-controls">
              <button className="text-button today-button" onClick={goToToday}>Today</button>
              <button className="icon-button" aria-label="Previous week" onClick={() => moveWeek(-1)}><ChevronLeft size={18} /></button>
              <button className="icon-button" aria-label="Next week" onClick={() => moveWeek(1)}><ChevronRight size={18} /></button>
            </div>
          </section>

          <section className="day-strip" aria-label="Choose a day">
            {days.map((day) => {
              const key = dayKey(day);
              const isSelected = selectedDay === key;
              return <button key={key} className={`day-item ${isSelected && !showWholeWeek ? "day-selected" : ""}`} onClick={() => { setSelectedDay(key); setShowWholeWeek(false); setQuery(""); }}>
                <span>{new Intl.DateTimeFormat("en", { weekday: "short" }).format(day)}</span>
                <strong>{day.getDate()}</strong>
                {tasks.some((task) => dayKey(new Date(task.dueAt)) === key) && <i />}
              </button>;
            })}
          </section>

          <section className="summary-grid">
            <article className="summary-card done-summary">
              <div className="summary-icon summary-check-icon"><Check size={17} /></div>
              <div><span>Task Complete</span><strong>{weekDone.toString().padStart(2, "0")}</strong><small>This Week</small></div>
              <div className="summary-decoration"><Check size={76} /></div>
            </article>
            <article className="summary-card open-summary">
              <div className="summary-icon summary-pending-icon"><X size={17} /></div>
              <div><span>Task Pending</span><strong>{weekOpen.toString().padStart(2, "0")}</strong><small>This Week</small></div>
              <div className="summary-decoration"><Circle size={84} /></div>
            </article>
          </section>

          <section className="week-progress-card">
            <div className="progress-card-heading"><span>Weekly Progress</span><strong>{progress}%</strong></div>
            <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
            <p>{weekDone} of {weekTotal} tasks completed this week</p>
          </section>

          <section className="tasks-section">
            <div className="tasks-header">
              <div className="task-heading-line">
                <h2>{query ? "Search results" : showWholeWeek ? "Tasks This Week" : selectedDay === dayKey(new Date()) ? "Tasks Today" : `Tasks ${new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date(`${selectedDay}T12:00:00`))}`}</h2>
                <span>{filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}</span>
              </div>
              {!query && <button className="text-button view-all-button" onClick={showWholeWeek ? goToToday : () => setShowWholeWeek(true)}>{showWholeWeek ? "Today" : "View All"}</button>}
            </div>

            <div className="task-list">
              {loading ? <div className="state-message"><LoaderCircle className="spin" size={22} /> Loading tasks...</div>
                : filteredTasks.length ? filteredTasks.map((task) => <TaskRow key={task._id} task={task} onToggle={() => void updateStatus(task)} onEdit={() => openEdit(task)} onDelete={() => void deleteTask(task)} />)
                  : <div className="empty-state">
                    <div className="empty-icon"><ListFilter size={22} /></div>
                    <strong>{query ? "No matching tasks" : "No tasks for this day"}</strong>
                    <p>{query ? "Try another keyword or clear your search." : "Add a task whenever you are ready."}</p>
                    {!query && <button className="text-button" onClick={openCreate}><Plus size={16} /> Add a task</button>}
                  </div>}
            </div>
          </section>
        </div>
      </section>

      <button className="mobile-add" onClick={openCreate} aria-label="Add task"><Plus size={24} /></button>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <header className="modal-header">
            <div><h2 id="modal-title">{editing ? "Edit Task" : "Add New Task"}</h2></div>
            <button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={19} /></button>
          </header>
          <form onSubmit={saveTask}>
            <label className="form-field"><span>Task title <b>*</b></span><input autoFocus required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Add a task" /></label>
            <div className="time-field-group">
              <span className="field-caption">Set Time <b>*</b></span>
              <div className="form-row">
                <label className="form-field"><span><Clock3 size={14} /> Start</span><input type="time" required value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} /></label>
                <label className="form-field"><span><Clock3 size={14} /> Ends</span><input type="time" required value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} /></label>
              </div>
            </div>
            <label className="form-field"><span>Set Date <b>*</b></span><input type="date" required value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
            <label className="form-field"><span>Description <small>OPTIONAL</small></span><textarea rows={3} maxLength={1000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Add Description" /></label>
            <div className="form-row">
              <label className="form-field priority-select-field"><span>Priority</span><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{editing ? "Save changes" : "Create task"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const completed = task.status === "completed";
  return <article className={`task-row ${completed ? "task-completed" : ""}`}>
    <button className={`task-check ${completed ? "checked" : ""}`} onClick={onToggle} aria-pressed={completed} aria-label={completed ? "Mark as in progress" : "Mark as completed"} />
    <div className="task-main">
      <div className="task-title-line"><h3>{task.title}</h3><span className={`priority-dot priority-${task.priority}`} title={`${task.priority} priority`} /></div>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className="task-meta"><span><Clock3 size={13} />{displayTimeRange(task)}</span><span className={`priority-label priority-text-${task.priority}`}>{task.priority} priority</span></div>
    </div>
    <div className="task-actions"><span className="task-status">{completed ? "Done" : "In progress"}</span><button onClick={onDelete} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button><button onClick={onEdit} aria-label={`Edit ${task.title}`}><Pencil size={15} /></button></div>
  </article>;
}
