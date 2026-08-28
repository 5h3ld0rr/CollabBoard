import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Kanban,
  WifiOff,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Board, Workspace } from '../../types';
import { COLOR_OPTIONS } from '../../constants';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onCreateBoard: (board: Board) => void;
}

const ICON_OPTIONS = [
  { name: 'Kanban', icon: <Kanban className="w-4 h-4" /> },
  { name: 'Layers', icon: <Layers className="w-4 h-4" /> },
  { name: 'WifiOff', icon: <WifiOff className="w-4 h-4" /> },
  { name: 'ShieldCheck', icon: <ShieldCheck className="w-4 h-4" /> },
];

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  currentWorkspaceId,
  onCreateBoard,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState(currentWorkspaceId || workspaces[0]?.id || 'ws-1');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0].name);
  const [tagInput, setTagInput] = useState('Frontend, Core');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkspaceId(currentWorkspaceId || workspaces[0]?.id || 'ws-1');
      setTitle('');
      setDescription('');
      setError(null);
    }
  }, [isOpen, currentWorkspaceId, workspaces]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a board title.');
      return;
    }

    const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'No description provided.',
      workspaceId,
      workspaceName: selectedWorkspace ? selectedWorkspace.name : 'Engineering',
      color: selectedColor,
      icon: selectedIcon,
      isFavorite: false,
      members: [],
      tags: parsedTags.length > 0 ? parsedTags : ['General'],
      stats: {
        totalTasks: 0,
        todoCount: 0,
        inProgressCount: 0,
        doneCount: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: 'Just now',
    };

    onCreateBoard(newBoard);
    onClose();
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
            <h2 className="text-xl font-bold text-white">Create New Board</h2>
            <p className="text-xs text-slate-400">
              Set up a collaborative visual workspace for your team
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Board Title <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Q4 Sprint Roadmap"
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
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this board's goals and scope..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Workspace Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Assign to Workspace
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color & Icon Pickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Theme Gradient */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Theme Color
              </label>
              <div className="flex items-center space-x-2">
                {COLOR_OPTIONS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-7 h-7 rounded-lg bg-linear-to-br ${c.value} transition-all ${
                      selectedColor === c.value
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Icon
              </label>
              <div className="flex items-center space-x-2">
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setSelectedIcon(ic.name)}
                    className={`p-2 rounded-lg border transition-all ${
                      selectedIcon === ic.name
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 scale-105'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ic.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags <span className="text-[10px] text-slate-500 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Backend, Sprint, Launch"
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Board</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
