import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Trash2, Loader2 } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, User } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  defaultStatus?: TaskStatus;
  boardId: string;
  availableAssignees?: User[];
  onSaveTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  initialTask,
  defaultStatus = 'todo',
  boardId,
  availableAssignees = [],
  onSaveTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setAssigneeId(initialTask.assignee?.id || '');
      setTagInput(initialTask.tags.join(', '));
      setDueDate(initialTask.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setAssigneeId('');
      setTagInput('Frontend, Feature');
      setDueDate('');
    }
    setError(null);
    setIsSubmitting(false);
  }, [initialTask, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Task title is required.');
      return;
    }

    if (trimmedTitle.length < 3) {
      setError('Task title must be at least 3 characters.');
      return;
    }

    const todayStr = getTodayString();
    if (dueDate.trim() && dueDate.trim() < todayStr) {
      setError('Due date cannot be in the past.');
      return;
    }

    const assignedUser: User | undefined = assigneeId
      ? availableAssignees.find((u: User) => u.id === assigneeId)
      : undefined;
    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const taskData: Task = {
      id: initialTask ? initialTask.id : `task-${Date.now()}`,
      title: trimmedTitle,
      description: description.trim(),
      status,
      priority,
      boardId: initialTask ? initialTask.boardId : boardId,
      assignee: assignedUser,
      tags: parsedTags.length > 0 ? parsedTags : ['General'],
      order: initialTask ? initialTask.order : 0,
      version: initialTask ? initialTask.version + 1 : 1,
      dueDate: dueDate.trim() || undefined,
      createdAt: initialTask ? initialTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setTimeout(() => {
      onSaveTask(taskData);
      setIsSubmitting(false);
      onClose();
    }, 350); // Visible loading state on save
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-100 ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {initialTask ? 'Edit Task Card' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialTask ? 'Update task metadata and assignee' : 'Add a task to the collaborative board'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Implement WebSocket Heartbeat"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical specifications, context, or acceptance criteria..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Column Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          {/* Assignee & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="">Unassigned</option>
                {availableAssignees.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.initials})
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Backend, API, Urgent"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Due Date Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              min={getTodayString()}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition scheme-dark"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {initialTask && onDeleteTask ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(initialTask.id);
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{initialTask ? 'Save Changes' : 'Create Task'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
