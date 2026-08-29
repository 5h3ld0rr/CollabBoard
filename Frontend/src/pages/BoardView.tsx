import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle2,
  Settings,
  User as UserIcon,
  Clock,
  Filter,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  AlertTriangle,
  Trash2,
  FileQuestion,
} from "lucide-react";
import { Navbar, AmbientBackground } from "../components/common";
import { Column, TaskModal, BoardSettingsModal } from "../components/board";
import { useBoard } from "../context";
import type { Board, Task, TaskStatus } from "../types";

export const BoardView: React.FC = () => {
  const { id: boardId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    state: { activeBoard: boardData, tasks, boardMembers, isLoading },
    loadBoard,
    addTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    clearBoardTasks,
    updateBoard,
    deleteBoard,
  } = useBoard();

  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
    }
  }, [boardId]);

  // URL-Reflected Filter States
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const selectedAssignee = searchParams.get("assignee") || "all";
  const selectedStatus =
    (searchParams.get("status") as TaskStatus | "all") || "all";
  const isOverdueFilter = searchParams.get("overdue") === "true";
  const selectedTag = searchParams.get("tag") || "all";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] =
    useState<TaskStatus>("todo");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Searchable Assignee Dropdown State
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Status Dropdown State
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const STATUS_OPTIONS: {
    id: TaskStatus | "all";
    label: string;
    dot: string;
  }[] = useMemo(
    () => [
      { id: "all", label: "All Statuses", dot: "bg-slate-400" },
      { id: "todo", label: "To Do", dot: "bg-blue-400" },
      { id: "in-progress", label: "In Progress", dot: "bg-amber-400" },
      { id: "done", label: "Completed", dot: "bg-emerald-400" },
    ],
    [],
  );

  const currentStatusOption = useMemo(
    () =>
      STATUS_OPTIONS.find((s) => s.id === selectedStatus) || STATUS_OPTIONS[0],
    [STATUS_OPTIONS, selectedStatus],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isAssigneeDropdownOpen || isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAssigneeDropdownOpen, isStatusDropdownOpen]);

  // Task Search Input Ref & Keyboard Shortcut
  const taskSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        taskSearchInputRef.current?.focus();
        taskSearchInputRef.current?.select();
      } else if (
        e.key === "Escape" &&
        document.activeElement === taskSearchInputRef.current
      ) {
        taskSearchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedUser = useMemo(
    () => boardMembers.find((u) => u.id === selectedAssignee),
    [boardMembers, selectedAssignee],
  );

  const filteredMembersForDropdown = useMemo(() => {
    if (!assigneeSearchQuery.trim()) return boardMembers;
    const q = assigneeSearchQuery.toLowerCase().trim();
    return boardMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.initials.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)),
    );
  }, [boardMembers, assigneeSearchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to update URL search parameters
  const updateFilters = (updates: {
    search?: string;
    assignee?: string;
    status?: TaskStatus | "all";
    overdue?: boolean;
    tag?: string;
  }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        if (updates.search !== undefined) {
          if (updates.search.trim()) {
            next.set("search", updates.search);
          } else {
            next.delete("search");
          }
          next.delete("q"); // remove legacy q if present
        }

        if (updates.assignee !== undefined) {
          if (updates.assignee && updates.assignee !== "all") {
            next.set("assignee", updates.assignee);
          } else {
            next.delete("assignee");
          }
        }

        if (updates.status !== undefined) {
          if (updates.status && updates.status !== "all") {
            next.set("status", updates.status);
          } else {
            next.delete("status");
          }
        }

        if (updates.overdue !== undefined) {
          if (updates.overdue) {
            next.set("overdue", "true");
          } else {
            next.delete("overdue");
          }
        }

        if (updates.tag !== undefined) {
          if (updates.tag && updates.tag !== "all") {
            next.set("tag", updates.tag);
          } else {
            next.delete("tag");
          }
        }

        return next;
      },
      { replace: true },
    );
  };

  const handleClearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedAssignee !== "all" ||
    selectedStatus !== "all" ||
    isOverdueFilter ||
    selectedTag !== "all";

  // Count total overdue tasks across board
  const overdueTasksCount = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return tasks.filter(
      (t) =>
        t.status !== "done" &&
        Boolean(t.dueDate) &&
        new Date(t.dueDate!).getTime() < today,
    ).length;
  }, [tasks]);

  // Collect all unique tags for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [tasks]);

  // Filter tasks based on search, assignee, status, overdue, and tag
  const filteredTasks = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      // 1. Free-text search on title
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.title || "").toLowerCase().includes(q);
        if (!matchTitle) return false;
      }

      // 2. Filter by Assignee
      if (selectedAssignee !== "all") {
        const assigneeId = typeof task.assignee === "object" && task.assignee !== null ? task.assignee.id : String(task.assignee || "");
        if (selectedAssignee === "unassigned") {
          if (task.assignee) return false;
        } else {
          if (!assigneeId || assigneeId !== selectedAssignee)
            return false;
        }
      }

      // 3. Filter by Status
      const normalizedStatus = task.status === ("doing" as any) ? "in-progress" : task.status;
      if (selectedStatus !== "all" && normalizedStatus !== selectedStatus) {
        return false;
      }

      // 4. Filter by Overdue
      if (isOverdueFilter) {
        const isTaskOverdue =
          normalizedStatus !== "done" &&
          Boolean(task.dueDate) &&
          new Date(task.dueDate!).getTime() < today;
        if (!isTaskOverdue) return false;
      }

      // 5. Filter by Tag
      if (selectedTag !== "all" && !(task.tags || []).includes(selectedTag)) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedAssignee,
    selectedStatus,
    isOverdueFilter,
    selectedTag,
  ]);

  // Column grouped tasks
  const todoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "todo"),
    [filteredTasks],
  );
  const inProgressTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "in-progress"),
    [filteredTasks],
  );
  const doneTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "done"),
    [filteredTasks],
  );

  // Task mutation handlers
  const handleOpenCreateTask = (status: TaskStatus = "todo") => {
    setEditingTask(null);
    setModalDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleRequestDeleteTask = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setTaskToDelete(found);
    }
  };

  const handleConfirmDeleteTask = () => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id);
    showToast(`Task "${taskToDelete.title}" deleted`);
    setTaskToDelete(null);
  };

  const handleMoveStatus = (taskId: string, newStatus: TaskStatus) => {
    moveTaskStatus(taskId, newStatus);
    showToast(`Task moved to ${newStatus.replace("-", " ")}`);
  };

  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    handleMoveStatus(taskId, targetStatus);
  };

  const handleSaveTask = async (savedTask: Task) => {
    const exists = tasks.some((t) => t.id === savedTask.id);
    if (exists) {
      await updateTask(savedTask);
      showToast("Task updated successfully");
    } else {
      if (boardData) {
        await addTask(boardData.id, savedTask);
        showToast("New task added to board");
      }
    }
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    updateBoard(updatedBoard);
    showToast("Board updated successfully");
  };

  const handleDeleteBoard = (deletedBoardId: string) => {
    deleteBoard(deletedBoardId);
    showToast("Board deleted");
    navigate("/dashboard");
  };

  const handleClearTasks = () => {
    if (boardData) {
      clearBoardTasks(boardData.id);
      showToast("All tasks cleared from board");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <AmbientBackground variant="minimal" />

      {/* Top Navbar */}
      <Navbar currentWorkspace={boardData?.workspaceName || "CollabBoard"} hideSearch />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Board Canvas */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          /* Loading State Skeleton */
          <div className="flex-1 flex flex-col space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800" />
                  <div className="w-24 h-4 rounded-md bg-slate-800" />
                </div>
                <div className="w-64 h-8 rounded-xl bg-slate-800" />
                <div className="w-96 max-w-full h-4 rounded-md bg-slate-800/60" />
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800" />
                <div className="w-28 h-9 rounded-xl bg-slate-800" />
              </div>
            </div>

            {/* Filter Bar Skeleton */}
            <div className="h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80" />

            {/* Columns Skeleton */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6">
              {[1, 2, 3].map((col) => (
                <div
                  key={col}
                  className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/60">
                    <div className="w-24 h-4 rounded-md bg-slate-800" />
                    <div className="w-6 h-6 rounded-lg bg-slate-800" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-32 rounded-xl bg-slate-900/80 border border-slate-800/60 p-3 space-y-2">
                      <div className="w-16 h-3 rounded bg-slate-800" />
                      <div className="w-3/4 h-4 rounded bg-slate-800" />
                      <div className="w-full h-3 rounded bg-slate-800/50" />
                    </div>
                    <div className="h-28 rounded-xl bg-slate-900/80 border border-slate-800/60 p-3 space-y-2">
                      <div className="w-16 h-3 rounded bg-slate-800" />
                      <div className="w-2/3 h-4 rounded bg-slate-800" />
                      <div className="w-5/6 h-3 rounded bg-slate-800/50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !boardData ? (
          /* Not Found State (Bad ID Handling) */
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-5 shadow-xl shadow-black/40">
              <FileQuestion className="w-8 h-8 text-indigo-400" />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 mb-3">
              404 Not Found
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Board Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
              The board with ID <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs">{boardId}</code> could not be found. It may have been moved, deleted, or never existed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          /* Loaded Success State */
          <>
            {/* Board Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-3">
                  <Link
                    to="/dashboard"
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition flex items-center space-x-1"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {boardData.workspaceName}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {boardData.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  {boardData.description}
                </p>
              </div>

              {/* Right Action Tools */}
              <div className="flex items-center space-x-3">
                {/* Board Settings Action Button */}
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                  title="Board Settings (General, Members, Danger Zone)"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Create Task Button */}
                <button
                  onClick={() => handleOpenCreateTask("todo")}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 hover:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Board Search & Filter Controls Strip */}
            <div className="relative z-30 space-y-3 mb-6">
              {/* Main Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl">
                {/* Left Controls: Title Search & Dropdowns */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-70">
                  {/* Free-text Search on Title */}
                  <div className="relative flex-1 min-w-45 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={taskSearchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) =>
                        updateFilters({ search: e.target.value })
                      }
                      placeholder="Search by task title..."
                      className="w-full pl-8.5 pr-14 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
                    />
                    {searchQuery ? (
                      <button
                        onClick={() => updateFilters({ search: "" })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-500 bg-slate-900 rounded border border-slate-800">
                          Ctrl K
                        </kbd>
                      </div>
                    )}
                  </div>

                  {/* Searchable Assignee Filter Popover */}
                  <div className="relative" ref={assigneeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAssigneeDropdownOpen((prev) => !prev);
                        setAssigneeSearchQuery("");
                      }}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        selectedAssignee !== "all"
                          ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-md shadow-indigo-950/40"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
                      }`}
                      title="Filter by assigned member"
                    >
                      {selectedUser ? (
                        <>
                          <div
                            className={`w-4 h-4 rounded-full ${selectedUser.color} text-white font-bold text-[8px] flex items-center justify-center`}
                          >
                            {selectedUser.initials}
                          </div>
                          <span className="truncate max-w-27.5">
                            {selectedUser.name}
                          </span>
                        </>
                      ) : selectedAssignee === "unassigned" ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[8px] flex items-center justify-center font-bold">
                            ?
                          </div>
                          <span>Unassigned</span>
                        </>
                      ) : (
                        <>
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>All Assignees</span>
                        </>
                      )}
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 transition-transform ${
                          isAssigneeDropdownOpen
                            ? "rotate-180 text-indigo-400"
                            : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Popover Menu */}
                    {isAssigneeDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10">
                        {/* Search Input */}
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            autoFocus
                            value={assigneeSearchQuery}
                            onChange={(e) =>
                              setAssigneeSearchQuery(e.target.value)
                            }
                            placeholder="Search members..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                          />
                          {assigneeSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAssigneeSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Options List */}
                        <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
                          {/* All Assignees Option */}
                          <button
                            type="button"
                            onClick={() => {
                              updateFilters({ assignee: "all" });
                              setIsAssigneeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                              selectedAssignee === "all"
                                ? "bg-indigo-600 text-white font-semibold"
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>All Assignees</span>
                            </div>
                            {selectedAssignee === "all" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Unassigned Option */}
                          <button
                            type="button"
                            onClick={() => {
                              updateFilters({ assignee: "unassigned" });
                              setIsAssigneeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                              selectedAssignee === "unassigned"
                                ? "bg-indigo-600 text-white font-semibold"
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[8px] flex items-center justify-center font-bold">
                                ?
                              </div>
                              <span>Unassigned</span>
                            </div>
                            {selectedAssignee === "unassigned" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="my-1 border-t border-slate-800" />

                          {/* Member List */}
                          {filteredMembersForDropdown.length === 0 ? (
                            <p className="text-center py-3 text-xs text-slate-500">
                              No members found
                            </p>
                          ) : (
                            filteredMembersForDropdown.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  updateFilters({ assignee: user.id });
                                  setIsAssigneeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                                  selectedAssignee === user.id
                                    ? "bg-indigo-600 text-white font-semibold"
                                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-full ${user.color} text-white font-bold text-[9px] flex items-center justify-center shrink-0`}
                                  >
                                    {user.initials}
                                  </div>
                                  <div className="text-left min-w-0">
                                    <p className="truncate text-xs">
                                      {user.name}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-400">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                                {selectedAssignee === user.id && (
                                  <Check className="w-3.5 h-3.5 shrink-0 ml-1" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Status Dropdown Filter */}
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        selectedStatus !== "all"
                          ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-md shadow-indigo-950/40"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
                      }`}
                      title="Filter by status"
                    >
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${currentStatusOption.dot}`}
                        />
                        <span>{currentStatusOption.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 transition-transform ${
                          isStatusDropdownOpen
                            ? "rotate-180 text-indigo-400"
                            : ""
                        }`}
                      />
                    </button>

                    {/* Status Dropdown Popover */}
                    {isStatusDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              updateFilters({ status: opt.id });
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                              selectedStatus === opt.id
                                ? "bg-indigo-600 text-white font-semibold"
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span
                                className={`w-2 h-2 rounded-full ${opt.dot}`}
                              />
                              <span>{opt.label}</span>
                            </div>
                            {selectedStatus === opt.id && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Overdue Quick Toggle */}
                  <button
                    onClick={() => updateFilters({ overdue: !isOverdueFilter })}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isOverdueFilter
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Overdue</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-400 font-bold border border-rose-800/50">
                      {overdueTasksCount}
                    </span>
                  </button>

                  {/* Reset All Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/50 transition cursor-pointer"
                      title="Clear all active filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Right Stat Summary */}
                <div className="text-xs text-slate-400 hidden sm:block">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {filteredTasks.length}
                  </span>{" "}
                  of {tasks.length} cards
                </div>
              </div>

              {/* Tag Quick Filter Pills Bar */}
              {allTags.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] shrink-0">
                    Tags:
                  </span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ tag: "all" })}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedTag === "all"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        updateFilters({
                          tag: selectedTag === tag ? "all" : tag,
                        })
                      }
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selectedTag === tag
                          ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                          : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Empty Search/Filter State Banner if 0 cards match */}
            {filteredTasks.length === 0 && (
              <div className="p-8 mb-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
                <div className="w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    No tasks match your filters
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Try clearing some of your search queries, tag, status, or
                    assignee filters to see more cards.
                  </p>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateTask("todo")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Task</span>
                  </button>
                </div>
              </div>
            )}

            {/* Kanban Columns Canvas */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6">
              <Column
                title="To Do"
                status="todo"
                colorDot="bg-slate-400"
                accentBadge="bg-slate-800 text-slate-300"
                tasks={todoTasks}
                onAddTask={handleOpenCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleRequestDeleteTask}
                onMoveStatus={handleMoveStatus}
                onDropTask={handleDropTask}
              />

              <Column
                title="In Progress"
                status="in-progress"
                colorDot="bg-indigo-400"
                accentBadge="bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                tasks={inProgressTasks}
                onAddTask={handleOpenCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleRequestDeleteTask}
                onMoveStatus={handleMoveStatus}
                onDropTask={handleDropTask}
              />

              <Column
                title="Completed"
                status="done"
                colorDot="bg-emerald-400"
                accentBadge="bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                tasks={doneTasks}
                onAddTask={handleOpenCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleRequestDeleteTask}
                onMoveStatus={handleMoveStatus}
                onDropTask={handleDropTask}
              />
            </div>
          </>
        )}
      </main>

      {/* Task Create / Edit Modal */}
      {boardData && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialTask={editingTask}
          defaultStatus={modalDefaultStatus}
          boardId={boardData.id}
          availableAssignees={boardMembers}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleRequestDeleteTask}
        />
      )}

      {/* Board Settings Modal (General, Members, Danger Zone) */}
      {boardData && (
        <BoardSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          board={boardData}
          onUpdateBoard={handleUpdateBoard}
          onDeleteBoard={handleDeleteBoard}
          onClearTasks={handleClearTasks}
        />
      )}

      {/* Task Deletion Confirmation Dialog */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl shadow-black/90 text-slate-100 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100">
            {/* Modal Icon & Heading */}
            <div className="flex items-center space-x-3.5 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  Delete Task?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTask}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
