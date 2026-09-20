import { useState, useEffect } from 'react';
import {
  X,
  Settings,
  AlertTriangle,
  Check,
  Kanban,
  Layers,
  ShieldCheck,
  WifiOff,
  Activity,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import type { Board, User, Workspace } from '../../types';
import { COLOR_OPTIONS } from '../../constants';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateBoard: (updatedBoard: Board) => void | Promise<void>;
  onDeleteBoard?: (boardId: string) => void;
  onClearTasks?: () => void;
  initialTab?: 'general' | 'danger' | string;
  workspaceMembers?: User[];
  workspaces?: Workspace[];
}

const ICON_OPTIONS = [
  { name: 'Kanban', icon: Kanban, label: 'Board' },
  { name: 'Layers', icon: Layers, label: 'Layers' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Security' },
  { name: 'WifiOff', icon: WifiOff, label: 'Offline' },
  { name: 'Activity', icon: Activity, label: 'Activity' },
  { name: 'Sparkles', icon: Sparkles, label: 'Sprint' },
];

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  onClose,
  board,
  onUpdateBoard,
  onDeleteBoard,
  onClearTasks,
  initialTab = 'general',
  workspaces = [],
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'danger'>(
    initialTab === 'danger' ? 'danger' : 'general'
  );
  
  // General Tab States
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(board.workspaceId || '');
  const [color, setColor] = useState(board.color || COLOR_OPTIONS[0].value);
  const [icon, setIcon] = useState(board.icon || 'Kanban');
  const [tagsInput, setTagsInput] = useState(Array.isArray(board.tags) ? board.tags.join(', ') : '');

  // Danger Zone States
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'danger' ? 'danger' : 'general');
      setTitle(board.title);
      setDescription(board.description);
      setSelectedWorkspaceId(board.workspaceId || '');
      setColor(board.color || COLOR_OPTIONS[0].value);
      setIcon(board.icon || 'Kanban');
      setTagsInput(Array.isArray(board.tags) ? board.tags.join(', ') : '');
      setConfirmDelete(false);
      setConfirmClear(false);
      setSuccessMessage(null);
      setErrorMessage(null);
      setIsSaving(false);
    }
  }, [isOpen, board, initialTab]);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // General Tab Save
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const targetWs = workspaces?.find((w) => w.id === selectedWorkspaceId);
    const updated: Board = {
      ...board,
      title: title.trim() || board.title,
      description: description.trim(),
      color,
      icon,
      tags: cleanTags.length > 0 ? cleanTags : (Array.isArray(board.tags) ? board.tags : []),
      workspaceId: selectedWorkspaceId || board.workspaceId,
      workspaceName: targetWs ? targetWs.name : board.workspaceName,
      updatedAt: 'Just now',
    };

    setIsSaving(true);
    try {
      await onUpdateBoard(updated);
      showSuccess('Board general settings updated!');
    } catch (err: any) {
      showError(err?.message || 'Failed to update board settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Danger Zone Actions
  const handleClearTasks = () => {
    if (onClearTasks) {
      onClearTasks();
      setConfirmClear(false);
      showSuccess('All tasks cleared from board.');
    }
  };

  const handleDeleteBoard = () => {
    if (onDeleteBoard) {
      onDeleteBoard(board.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-100 ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${color} flex items-center justify-center text-white shadow-md`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Board Settings</h2>
            <p className="text-xs text-slate-400">
              General configuration and board controls
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center space-x-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Board Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
            </div>

            {/* Workspace Switcher */}
            {workspaces && workspaces.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Workspace
                </label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Switch or move this board across your workspaces
                </p>
              </div>
            )}

            {/* Board Icon */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Board Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = icon === ic.name;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcon(ic.name)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{ic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Board Theme */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Board Theme Color
              </label>
              <div className="flex items-center space-x-2.5">
                {COLOR_OPTIONS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-lg bg-linear-to-br ${c.value} transition-all cursor-pointer ${
                      color === c.value
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tags <span className="text-slate-500 lowercase font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Backend, WebSocket, Priority"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DANGER ZONE */}
        {activeTab === 'danger' && (
          <div className="space-y-4">
            {/* Clear Board Tasks */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clear All Tasks</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Delete all tasks across To Do, In Progress, and Done columns on this board.
                  </p>
                </div>
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition shrink-0 cursor-pointer"
                  >
                    Clear Tasks
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearTasks}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Board */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Delete this Board</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Once deleted, all cards, column states, and data associated with &ldquo;{board.title}&rdquo; will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    Delete Board
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-rose-300 font-medium">Are you sure?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteBoard}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/50 cursor-pointer"
                    >
                      Yes, Delete Board
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
