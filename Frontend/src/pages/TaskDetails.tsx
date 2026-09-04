import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Share2,
  Edit2,
  Trash2,
  Activity,
  Check,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  MessageSquare,
  Send,
  Loader2,
  User as UserIcon,
} from 'lucide-react';
import { Navbar, AmbientBackground, OfflineIndicator } from '../components/common';
import { TaskModal, ConflictModal } from '../components/board';
import {
  getTaskById,
  getBoardById,
  getTaskComments,
  addComment,
  deleteComment,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
} from '../api';
import {
  getCachedTask,
  getCachedBoard,
  updateCachedTask,
  saveBoardToCache,
} from '../db';
import { useAuth } from '../context/AuthContext';
import type { Task, Board, TaskStatus, TaskPriority, User, TaskComment } from '../types';

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
  },
  high: {
    label: 'High',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
  },
};

const STATUS_STEPS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-indigo-400' },
  { id: 'done', label: 'Completed', color: 'bg-emerald-400' },
];

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const { user: authUser } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [boardMembers, setBoardMembers] = useState<User[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Comment edit & delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<TaskComment | null>(null);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);

  // Task edit & delete modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 409 OCC Conflict Resolution State
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictLocalTask, setConflictLocalTask] = useState<Task | null>(null);
  const [conflictServerTask, setConflictServerTask] = useState<Task | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Find task across all mock boards via API and IndexedDB cache
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      // 1. Instant Cache Hydration from IndexedDB (0ms delay)
      const cachedTask = await getCachedTask(id);
      if (cachedTask && isMounted) {
        setTask(cachedTask);
        const cachedBoard = await getCachedBoard(cachedTask.boardId);
        if (cachedBoard && isMounted) {
          setBoard(cachedBoard);
          setBoardMembers(cachedBoard.members || []);
        }
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // 2. Background Revalidation from API
      try {
        const foundTask = await getTaskById(id);
        if (!isMounted) return;

        if (foundTask) {
          setTask(foundTask);
          await updateCachedTask(foundTask);

          const [foundBoard, taskComments] = await Promise.all([
            getBoardById(foundTask.boardId),
            getTaskComments(foundTask.id),
          ]);
          if (!isMounted) return;

          setBoard(foundBoard);
          if (foundBoard) {
            setBoardMembers(foundBoard.members || []);
            await saveBoardToCache(foundBoard);
          }
          setComments(taskComments);
        } else if (!cachedTask) {
          setTask(null);
          setBoard(null);
          setComments([]);
        }
      } catch (err) {
        console.warn('[TaskDetails] Network fetch failed, retaining cached data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const priorityInfo = task ? PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium : PRIORITY_CONFIG.medium;

  const isDone = task?.status === 'done';
  const isOverdue = useMemo(() => {
    if (!task || isDone || !task.dueDate) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    return new Date(task.dueDate).getTime() < today;
  }, [task, isDone]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const updated = await apiUpdateTask(task.id, { status: newStatus, version: task.version });
      setTask(updated);
      await updateCachedTask(updated);
      showToast(`Status updated to ${newStatus === 'in-progress' ? 'In Progress' : newStatus === 'done' ? 'Completed' : 'To Do'}`);
    } catch (err: any) {
      if (err?.status === 409 || err?.code === 'CONFLICT') {
        const serverDoc = err.details?.current || (await getTaskById(task.id)) || task;
        setConflictLocalTask({ ...task, status: newStatus });
        setConflictServerTask(serverDoc);
        setIsConflictModalOpen(true);
      } else {
        showToast(err?.message || 'Failed to update status');
      }
    }
  };

  const handleSaveTask = async (savedTask: Task) => {
    try {
      const updated = await apiUpdateTask(savedTask.id, savedTask);
      setTask(updated);
      await updateCachedTask(updated);
      setIsEditModalOpen(false);
      showToast('Task updated successfully');
    } catch (err: any) {
      if (err?.status === 409 || err?.code === 'CONFLICT') {
        // Handle 409 OCC Conflict State
        let serverDoc = err.details?.current;
        if (!serverDoc) {
          serverDoc = await getTaskById(savedTask.id);
        }
        if (serverDoc) {
          setConflictLocalTask(savedTask);
          setConflictServerTask(serverDoc);
          setIsConflictModalOpen(true);
        } else {
          showToast('Conflict detected. Please retry.');
        }
      } else {
        showToast(err?.message || 'Failed to update task');
      }
    }
  };

  const handleConflictOverwrite = async (resolvedTask: Task) => {
    const updated = await apiUpdateTask(resolvedTask.id, resolvedTask);
    setTask(updated);
    await updateCachedTask(updated);
    showToast('Changes saved (force overwrite applied)');
  };

  const handleConflictDiscard = (serverTask: Task) => {
    setTask(serverTask);
    updateCachedTask(serverTask);
    showToast("Reverted to server's latest version");
  };

  const handleConflictMerge = async (mergedTask: Task) => {
    const updated = await apiUpdateTask(mergedTask.id, mergedTask);
    setTask(updated);
    await updateCachedTask(updated);
    showToast('Merged version saved successfully');
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    await apiDeleteTask(task.id);
    showToast('Task deleted successfully');
    setIsDeleteModalOpen(false);
    if (board) {
      navigate(`/boards/${board.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !task) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(task.id, commentInput.trim(), authUser || undefined);
      setComments((prev) => [newComment, ...prev]);
      setCommentInput('');
      showToast('Comment posted successfully');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStartEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content: editingCommentText.trim() } : c))
    );
    setEditingCommentId(null);
    setEditingCommentText('');
    showToast('Comment updated successfully');
  };

  const handlePromptDeleteComment = (comment: TaskComment) => {
    setCommentToDelete(comment);
    setIsDeleteCommentModalOpen(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete || !task) return;
    await deleteComment(task.id, commentToDelete.id);
    setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
    setIsDeleteCommentModalOpen(false);
    setCommentToDelete(null);
    showToast('Comment deleted');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Task link copied to clipboard!');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <AmbientBackground variant="minimal" />

      {/* Top Navbar */}
      <Navbar currentWorkspace={board?.workspaceName || 'CollabBoard'} hideSearch />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          /* Loading State Skeleton */
          <div className="space-y-6 animate-pulse">
            <div className="flex items-center space-x-3 pb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-800" />
              <div className="w-48 h-4 rounded-md bg-slate-800" />
            </div>
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
              <div className="space-y-3">
                <div className="w-24 h-5 rounded-full bg-slate-800" />
                <div className="w-3/4 h-8 rounded-xl bg-slate-800" />
                <div className="w-full h-16 rounded-xl bg-slate-800/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="h-24 rounded-2xl bg-slate-800/40" />
                <div className="h-24 rounded-2xl bg-slate-800/40" />
                <div className="h-24 rounded-2xl bg-slate-800/40" />
              </div>
            </div>
          </div>
        ) : !task ? (
          /* Not Found State (Bad ID Handling) */
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-5 shadow-xl shadow-black/40">
              <FileQuestion className="w-8 h-8 text-indigo-400" />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 mb-3">
              404 Not Found
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Task Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
              The task with ID <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs">{id}</code> could not be found. It may have been moved, deleted, or never existed.
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
          /* Task Details View */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Navigation & Breadcrumb Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <button
                  onClick={() => (board ? navigate(`/boards/${board.id}`) : navigate('/dashboard'))}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition flex items-center space-x-1 cursor-pointer"
                  title="Back to board"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Link to="/dashboard" className="hover:text-white transition">
                  Workspaces
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                {board ? (
                  <Link to={`/boards/${board.id}`} className="hover:text-white transition font-medium text-slate-300">
                    {board.title}
                  </Link>
                ) : (
                  <span>Board</span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-indigo-400 font-semibold truncate max-w-40 sm:max-w-xs">
                  {task.title}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5">
                <OfflineIndicator />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition cursor-pointer"
                  title="Copy Task URL"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/50 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Task</span>
                </button>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Task Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Main Details & Comments */}
              <div className="lg:col-span-2 space-y-6">
                {/* Main Task Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
                  {/* Priority & Status Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                      <span>{priorityInfo.label} Priority</span>
                    </span>

                    {isDone ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Completed</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Overdue</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        <span>In Progress</span>
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ml-auto">
                      ID: {task.id}
                    </span>
                  </div>

                  {/* Task Title */}
                  <h1
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight ${
                      isDone ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h1>

                  {/* Task Description */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-300 leading-relaxed min-h-24 whitespace-pre-wrap">
                      {task.description || (
                        <span className="text-slate-500 italic">No description provided for this task.</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Tags</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 text-indigo-300 border border-indigo-500/30 shadow-inner"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Status Flow Progression */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifecycle Progression</h3>
                    <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                      {STATUS_STEPS.map((step) => {
                        const isActive = task.status === step.id;
                        return (
                          <button
                            key={step.id}
                            onClick={() => handleStatusChange(step.id)}
                            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-white/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${step.color}`} />
                            <span>{step.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Discussion & Comments Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-white">Discussion</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                        {comments.length}
                      </span>
                    </div>
                  </div>

                  {/* Comment Input Box */}
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl ${authUser?.color || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow`}
                        title={authUser?.name || 'User'}
                      >
                        {authUser?.initials || (authUser?.name ? authUser.name.slice(0, 2).toUpperCase() : 'U')}
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          rows={3}
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment, note, or update..."
                          className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none shadow-inner"
                        />
                        <div className="flex items-center justify-end">
                          <button
                            type="submit"
                            disabled={!commentInput.trim() || isSubmittingComment}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-md shadow-indigo-950/50 transition cursor-pointer"
                          >
                            {isSubmittingComment ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Posting...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Post Comment</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Comments Feed List */}
                  <div className="space-y-3 pt-2">
                    {comments.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl bg-slate-950/50 border border-slate-800/60">
                        <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No comments yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Start the conversation by posting an update above.</p>
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isAuthor = comment.author.id === authUser?.id || comment.author.email === authUser?.email;
                        const isEditingThis = editingCommentId === comment.id;

                        return (
                          <div
                            key={comment.id}
                            className="group p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 transition space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div
                                  className={`w-6 h-6 rounded-lg ${comment.author.color} text-white font-bold text-[10px] flex items-center justify-center shadow-sm`}
                                >
                                  {comment.author.initials}
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-200 mr-2">
                                    {comment.author.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {formatRelativeTime(comment.createdAt)}
                                  </span>
                                </div>
                              </div>

                              {isAuthor && !isEditingThis && (
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(comment)}
                                    className="p-1 text-slate-500 hover:text-indigo-400 transition rounded-lg hover:bg-slate-900 cursor-pointer"
                                    title="Edit comment"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePromptDeleteComment(comment)}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-slate-900 cursor-pointer"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditingThis ? (
                              <div className="pt-1 pl-8.5 space-y-2">
                                <textarea
                                  rows={2}
                                  autoFocus
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none shadow-inner"
                                />
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditingCommentText('');
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!editingCommentText.trim()}
                                    onClick={() => handleSaveEditComment(comment.id)}
                                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow transition cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300 leading-relaxed pl-8.5 whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Metadata Cards */}
              <div className="space-y-6">
                {/* Assignee Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assignee</h3>
                  {task.assignee ? (
                    (() => {
                      const name = typeof task.assignee === 'object' && task.assignee !== null ? task.assignee.name : String(task.assignee);
                      const color = typeof task.assignee === 'object' && task.assignee?.color ? task.assignee.color : 'bg-indigo-600';
                      const initials = typeof task.assignee === 'object' && task.assignee?.initials ? task.assignee.initials : name.slice(0, 2).toUpperCase();
                      const email = typeof task.assignee === 'object' && task.assignee?.email ? task.assignee.email : '';

                      return (
                        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                          <div
                            className={`w-10 h-10 rounded-2xl ${color} text-white font-bold text-sm flex items-center justify-center shadow-md`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{name}</p>
                            {email && <p className="text-[10px] text-slate-400 truncate">{email}</p>}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Unassigned</p>
                        <p className="text-[10px] text-slate-500">No member assigned yet</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Due Date & Scheduling Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline & Due Date</h3>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isOverdue ? 'Overdue' : task.dueDate ? 'Scheduled deadline' : 'Flexible deadline'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent Board & Workspace Card */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Board & Workspace</h3>
                  {board ? (
                    <Link
                      to={`/boards/${board.id}`}
                      className="block p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/80 transition group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                          {board.workspaceName}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                        {board.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {board.description}
                      </p>
                    </Link>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                      Standalone task
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Task Edit Modal */}
      {task && (
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialTask={task}
          boardId={task.boardId}
          availableAssignees={boardMembers}
          onSaveTask={handleSaveTask}
          onDeleteTask={() => {
            setIsEditModalOpen(false);
            setIsDeleteModalOpen(true);
          }}
        />
      )}

      {/* Delete Task Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">Delete Task?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Are you sure? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 transition active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Dialog */}
      {isDeleteCommentModalOpen && commentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">Delete Comment?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Are you sure you want to delete this comment? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteCommentModalOpen(false);
                  setCommentToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteComment}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 transition active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 409 Conflict Resolution Modal */}
      {isConflictModalOpen && conflictLocalTask && conflictServerTask && (
        <ConflictModal
          isOpen={isConflictModalOpen}
          onClose={() => setIsConflictModalOpen(false)}
          localTask={conflictLocalTask}
          serverTask={conflictServerTask}
          onOverwrite={handleConflictOverwrite}
          onDiscard={handleConflictDiscard}
          onMerge={handleConflictMerge}
        />
      )}
    </div>
  );
};

export default TaskDetails;
