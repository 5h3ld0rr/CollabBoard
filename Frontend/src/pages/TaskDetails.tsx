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
import { Navbar, AmbientBackground } from '../components/common';
import { TaskModal } from '../components/board';
import { MOCK_BOARDS, MOCK_TASKS, MOCK_USERS, MOCK_COMMENTS, MOCK_CURRENT_USER } from '../data/mockData';
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
  const [board, setBoard] = useState<Board | null>(null);
  const [boardMembers, setBoardMembers] = useState<User[]>(MOCK_USERS);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Find task across all mock boards
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let foundTask: Task | null = null;
      let foundBoard: Board | null = null;

      if (id) {
        // Search through all boards
        for (const [boardId, taskList] of Object.entries(MOCK_TASKS)) {
          const matched = taskList.find((t) => t.id === id);
          if (matched) {
            foundTask = matched;
            foundBoard = MOCK_BOARDS.find((b) => b.id === boardId) || null;
            break;
          }
        }
      }

      setTask(foundTask);
      setBoard(foundBoard);
      if (foundBoard) {
        setBoardMembers(foundBoard.members || MOCK_USERS);
      }
      if (foundTask) {
        setComments(MOCK_COMMENTS[foundTask.id] || []);
      }
      setIsLoading(false);
    }, 450); // Artificial delay to ensure consistent loading feedback

    return () => clearTimeout(timer);
  }, [id]);

  const priorityInfo = task ? PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium : PRIORITY_CONFIG.medium;

  const isDone = task?.status === 'done';
  const isOverdue = useMemo(() => {
    if (!task || isDone || !task.dueDate) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    return new Date(task.dueDate).getTime() < today;
  }, [task, isDone]);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!task) return;
    setTask((prev) => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null));
    showToast(`Status updated to ${newStatus === 'in-progress' ? 'In Progress' : newStatus === 'done' ? 'Completed' : 'To Do'}`);
  };

  const handleSaveTask = (savedTask: Task) => {
    setTask(savedTask);
    setIsEditModalOpen(false);
    showToast('Task updated successfully');
  };

  const handleDeleteTask = () => {
    if (!task) return;
    showToast('Task deleted successfully');
    setIsDeleteModalOpen(false);
    if (board) {
      navigate(`/boards/${board.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !task) return;

    setIsSubmittingComment(true);
    setTimeout(() => {
      const newComment: TaskComment = {
        id: `comm-${Date.now()}`,
        taskId: task.id,
        author: MOCK_CURRENT_USER,
        content: commentInput.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setCommentInput('');
      setIsSubmittingComment(false);
      showToast('Comment posted successfully');
    }, 250);
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

  const handleConfirmDeleteComment = () => {
    if (!commentToDelete) return;
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
                        className={`w-8 h-8 rounded-xl ${MOCK_CURRENT_USER.color} text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow`}
                        title={MOCK_CURRENT_USER.name}
                      >
                        {MOCK_CURRENT_USER.initials}
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
                        const isAuthor = comment.author.id === MOCK_CURRENT_USER.id;
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
                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div
                        className={`w-10 h-10 rounded-2xl ${task.assignee.color} text-white font-bold text-sm flex items-center justify-center shadow-md`}
                      >
                        {task.assignee.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{task.assignee.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{task.assignee.email}</p>
                      </div>
                    </div>
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
    </div>
  );
};

export default TaskDetails;
