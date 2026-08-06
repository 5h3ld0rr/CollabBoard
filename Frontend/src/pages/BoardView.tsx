import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Navbar, AmbientBackground } from '../components/common';
import { Column, TaskModal, BoardSettingsModal } from '../components/board';
import { MOCK_BOARDS, MOCK_TASKS, MOCK_USERS } from '../data/mockData';
import type { Board, Task, TaskStatus, User } from '../types';

export const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Find board or fallback to first
  const initialBoard: Board = useMemo(() => {
    const found = MOCK_BOARDS.find((b) => b.id === boardId);
    return (
      found || {
        id: boardId || 'board-1',
        title: 'Sprint 1: Real-time Core',
        description: 'WebSocket pipelines, live cursor broadcasting, and optimistic locking engine',
        workspaceId: 'ws-1',
        workspaceName: 'Core Engineering',
        color: 'from-indigo-600 to-violet-600',
        icon: 'Kanban',
        isFavorite: true,
        members: MOCK_USERS.slice(0, 3),
        tags: ['Backend', 'WebSocket', 'Priority'],
        stats: {
          totalTasks: 5,
          todoCount: 2,
          inProgressCount: 2,
          doneCount: 1,
        },
        createdAt: new Date().toISOString(),
        updatedAt: 'Just now',
      }
    );
  }, [boardId]);

  // Board reactive state
  const [boardData, setBoardData] = useState<Board>(initialBoard);

  useEffect(() => {
    setBoardData(initialBoard);
  }, [initialBoard]);

  // Board members state
  const [boardMembers, setBoardMembers] = useState<User[]>(boardData.members);

  useEffect(() => {
    setBoardMembers(boardData.members);
  }, [boardData.members]);

  // Tasks state for this board
  const [tasks, setTasks] = useState<Task[]>(() => {
    const initial = boardId ? MOCK_TASKS[boardId] : null;
    return initial || MOCK_TASKS['board-1'] || [];
  });

  // URL-Reflected Filter States
  const searchQuery = searchParams.get('search') || searchParams.get('q') || '';
  const selectedAssignee = searchParams.get('assignee') || 'all';
  const selectedStatus = (searchParams.get('status') as TaskStatus | 'all') || 'all';
  const isOverdueFilter = searchParams.get('overdue') === 'true';
  const selectedTag = searchParams.get('tag') || 'all';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('todo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Searchable Assignee Dropdown State
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Status Dropdown State
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const STATUS_OPTIONS: { id: TaskStatus | 'all'; label: string; dot: string }[] = useMemo(
    () => [
      { id: 'all', label: 'All Statuses', dot: 'bg-slate-400' },
      { id: 'todo', label: 'To Do', dot: 'bg-blue-400' },
      { id: 'in-progress', label: 'In Progress', dot: 'bg-amber-400' },
      { id: 'done', label: 'Completed', dot: 'bg-emerald-400' },
    ],
    []
  );

  const currentStatusOption = useMemo(
    () => STATUS_OPTIONS.find((s) => s.id === selectedStatus) || STATUS_OPTIONS[0],
    [STATUS_OPTIONS, selectedStatus]
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
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssigneeDropdownOpen, isStatusDropdownOpen]);

  const selectedUser = useMemo(
    () => boardMembers.find((u) => u.id === selectedAssignee),
    [boardMembers, selectedAssignee]
  );

  const filteredMembersForDropdown = useMemo(() => {
    if (!assigneeSearchQuery.trim()) return boardMembers;
    const q = assigneeSearchQuery.toLowerCase().trim();
    return boardMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.initials.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
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
    status?: TaskStatus | 'all';
    overdue?: boolean;
    tag?: string;
  }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        if (updates.search !== undefined) {
          if (updates.search.trim()) {
            next.set('search', updates.search);
          } else {
            next.delete('search');
          }
          next.delete('q'); // remove legacy q if present
        }

        if (updates.assignee !== undefined) {
          if (updates.assignee && updates.assignee !== 'all') {
            next.set('assignee', updates.assignee);
          } else {
            next.delete('assignee');
          }
        }

        if (updates.status !== undefined) {
          if (updates.status && updates.status !== 'all') {
            next.set('status', updates.status);
          } else {
            next.delete('status');
          }
        }

        if (updates.overdue !== undefined) {
          if (updates.overdue) {
            next.set('overdue', 'true');
          } else {
            next.delete('overdue');
          }
        }

        if (updates.tag !== undefined) {
          if (updates.tag && updates.tag !== 'all') {
            next.set('tag', updates.tag);
          } else {
            next.delete('tag');
          }
        }

        return next;
      },
      { replace: true }
    );
  };

  const handleClearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedAssignee !== 'all' ||
    selectedStatus !== 'all' ||
    isOverdueFilter ||
    selectedTag !== 'all';

  // Count total overdue tasks across board
  const overdueTasksCount = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return tasks.filter(
      (t) => t.status !== 'done' && Boolean(t.dueDate) && new Date(t.dueDate!).getTime() < today
    ).length;
  }, [tasks]);

  // Collect all unique tags for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [tasks]);

  // Filter tasks based on search, assignee, status, overdue, and tag
  const filteredTasks = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      // 1. Free-text search on title
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        if (!matchTitle) return false;
      }

      // 2. Filter by Assignee
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned') {
          if (task.assignee) return false;
        } else {
          if (!task.assignee || task.assignee.id !== selectedAssignee) return false;
        }
      }

      // 3. Filter by Status
      if (selectedStatus !== 'all' && task.status !== selectedStatus) {
        return false;
      }

      // 4. Filter by Overdue
      if (isOverdueFilter) {
        const isTaskOverdue =
          task.status !== 'done' &&
          Boolean(task.dueDate) &&
          new Date(task.dueDate!).getTime() < today;
        if (!isTaskOverdue) return false;
      }

      // 5. Filter by Tag
      if (selectedTag !== 'all' && !task.tags.includes(selectedTag)) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedAssignee, selectedStatus, isOverdueFilter, selectedTag]);

  // Column grouped tasks
  const todoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'todo'),
    [filteredTasks]
  );
  const inProgressTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'in-progress'),
    [filteredTasks]
  );
  const doneTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'done'),
    [filteredTasks]
  );

  // Task mutation handlers
  const handleOpenCreateTask = (status: TaskStatus = 'todo') => {
    setEditingTask(null);
    setModalDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Task removed from board');
  };

  const handleMoveStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
    showToast(`Task moved to ${newStatus.replace('-', ' ')}`);
  };

  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    handleMoveStatus(taskId, targetStatus);
  };

  const handleSaveTask = (savedTask: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === savedTask.id);
      if (exists) {
        showToast('Task updated successfully');
        return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
      } else {
        showToast('New task added to board');
        return [savedTask, ...prev];
      }
    });
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoardData(updatedBoard);
    setBoardMembers(updatedBoard.members);
    showToast('Board updated successfully');
  };

  const handleDeleteBoard = (_deletedBoardId: string) => {
    showToast('Board deleted');
    navigate('/boards');
  };

  const handleClearTasks = () => {
    setTasks([]);
    showToast('All tasks cleared from board');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <AmbientBackground variant="minimal" />

      {/* Top Navbar */}
      <Navbar currentWorkspace={boardData.workspaceName} hideSearch />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Board Canvas */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Board Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <Link
                to="/boards"
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
              onClick={() => handleOpenCreateTask('todo')}
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
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Free-text Search on Title */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  placeholder="Search by task title..."
                  className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => updateFilters({ search: '' })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Searchable Assignee Filter Popover */}
              <div className="relative" ref={assigneeDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAssigneeDropdownOpen((prev) => !prev);
                    setAssigneeSearchQuery('');
                  }}
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    selectedAssignee !== 'all'
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
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
                      <span className="truncate max-w-[110px]">{selectedUser.name}</span>
                    </>
                  ) : selectedAssignee === 'unassigned' ? (
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
                      isAssigneeDropdownOpen ? 'rotate-180 text-indigo-400' : ''
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
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        placeholder="Search members..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      />
                      {assigneeSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setAssigneeSearchQuery('')}
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
                          updateFilters({ assignee: 'all' });
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          selectedAssignee === 'all'
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>All Assignees</span>
                        </div>
                        {selectedAssignee === 'all' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {/* Unassigned Option */}
                      <button
                        type="button"
                        onClick={() => {
                          updateFilters({ assignee: 'unassigned' });
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          selectedAssignee === 'unassigned'
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[8px] flex items-center justify-center font-bold">
                            ?
                          </div>
                          <span>Unassigned</span>
                        </div>
                        {selectedAssignee === 'unassigned' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="my-1 border-t border-slate-800" />

                      {/* Members list */}
                      {filteredMembersForDropdown.length > 0 ? (
                        filteredMembersForDropdown.map((user) => {
                          const isSelected = selectedAssignee === user.id;
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                updateFilters({ assignee: user.id });
                                setIsAssigneeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded-full ${user.color} text-white font-bold text-[9px] flex items-center justify-center shrink-0 ring-1 ring-slate-700`}
                                >
                                  {user.initials}
                                </div>
                                <div className="text-left truncate">
                                  <p className="truncate font-medium">{user.name}</p>
                                  {user.email && (
                                    <p
                                      className={`text-[10px] truncate ${
                                        isSelected ? 'text-indigo-200' : 'text-slate-500'
                                      }`}
                                    >
                                      {user.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-center text-xs text-slate-500 py-3">No members found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Status Filter Popover */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    selectedStatus !== 'all'
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title="Filter by status"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <div className="flex items-center space-x-1.5">
                    {selectedStatus !== 'all' && (
                      <span className={`w-2 h-2 rounded-full ${currentStatusOption.dot}`} />
                    )}
                    <span>{currentStatusOption.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform ${
                      isStatusDropdownOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                {/* Status Dropdown Menu */}
                {isStatusDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10">
                    <div className="space-y-0.5">
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = selectedStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              updateFilters({ status: opt.id });
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                              <span>{opt.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Overdue Quick Toggle Button */}
              <button
                type="button"
                onClick={() => updateFilters({ overdue: !isOverdueFilter })}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isOverdueFilter
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-950/40'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
                title="Filter tasks that are past their due date"
              >
                <Clock className={`w-3.5 h-3.5 ${isOverdueFilter ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>Overdue</span>
                {overdueTasksCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isOverdueFilter
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {overdueTasksCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right Controls: Task count & Reset button */}
            <div className="flex items-center space-x-2.5 text-xs text-slate-400">
              <span className="text-[11px]">
                Showing <strong className="text-slate-200 font-semibold">{filteredTasks.length}</strong> of{' '}
                {tasks.length} cards
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition cursor-pointer"
                  title="Clear all active filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Secondary Tag Filter Strip (if board has tags) */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Tags:
              </span>
              <button
                type="button"
                onClick={() => updateFilters({ tag: 'all' })}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedTag === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All
              </button>

              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => updateFilters({ tag: selectedTag === tag ? 'all' : tag })}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kanban Columns Canvas */}
        <div className="flex-1 flex gap-5 overflow-x-auto pb-6 scrollbar-thin">
          <Column
            title="To Do"
            status="todo"
            colorDot="bg-slate-400"
            accentBadge="bg-slate-800 text-slate-300"
            tasks={todoTasks}
            onAddTask={handleOpenCreateTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
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
            onDeleteTask={handleDeleteTask}
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
            onDeleteTask={handleDeleteTask}
            onMoveStatus={handleMoveStatus}
            onDropTask={handleDropTask}
          />
        </div>

      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTask={editingTask}
        defaultStatus={modalDefaultStatus}
        boardId={boardData.id}
        availableAssignees={boardMembers}
        onSaveTask={handleSaveTask}
      />

      {/* Board Settings Modal (General, Members, Danger Zone) */}
      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={boardData}
        onUpdateBoard={handleUpdateBoard}
        onDeleteBoard={handleDeleteBoard}
        onClearTasks={handleClearTasks}
      />
    </div>
  );
};

export default BoardView;
