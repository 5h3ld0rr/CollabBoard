import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { Navbar, AmbientBackground } from '../components/common';
import { Column, TaskModal, BoardSettingsModal } from '../components/board';
import { MOCK_BOARDS, MOCK_TASKS, MOCK_USERS } from '../data/mockData';
import type { Board, Task, TaskStatus, User } from '../types';

export const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('todo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Collect all unique tags for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedTag !== 'all' && !task.tags.includes(selectedTag)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchTag = task.tags.some((t) => t.toLowerCase().includes(q));
        const matchAssignee = task.assignee?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag && !matchAssignee) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, selectedTag]);

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
      <Navbar currentWorkspace={boardData.workspaceName} />

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

        {/* Board Search & Tag Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                selectedTag === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Tasks ({tasks.length})
            </button>

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedTag === tag
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards in this board..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
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
