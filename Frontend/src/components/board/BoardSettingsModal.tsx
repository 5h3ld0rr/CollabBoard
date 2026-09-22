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
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Columns as ColumnsIcon,
  Palette,
} from 'lucide-react';
import type { Board, BoardColumn, User } from '../../types';
import { COLOR_OPTIONS } from '../../constants';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateBoard: (updatedBoard: Board) => void | Promise<void>;
  onDeleteBoard?: (boardId: string) => void;
  onClearTasks?: () => void;
  initialTab?: 'general' | 'columns' | 'danger' | string;
  workspaceMembers?: User[];
}

const ICON_OPTIONS = [
  { name: 'Kanban', icon: Kanban, label: 'Board' },
  { name: 'Layers', icon: Layers, label: 'Layers' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Security' },
  { name: 'WifiOff', icon: WifiOff, label: 'Offline' },
  { name: 'Activity', icon: Activity, label: 'Activity' },
  { name: 'Sparkles', icon: Sparkles, label: 'Sprint' },
];


const TAILWIND_COLOR_MAP: Record<string, string> = {
  'bg-slate-400': '#94a3b8',
  'bg-indigo-400': '#818cf8',
  'bg-emerald-400': '#34d399',
  'bg-amber-400': '#fbbf24',
  'bg-orange-400': '#fb923c',
  'bg-rose-400': '#fb7185',
  'bg-purple-400': '#c084fc',
  'bg-cyan-400': '#22d3ee',
  'bg-sky-400': '#38bdf8',
  'bg-teal-400': '#2dd4bf',
  'bg-violet-400': '#a78bfa',
  'bg-pink-400': '#f472b6',
  'bg-yellow-400': '#facc15',
  'bg-lime-400': '#a3e635',
  'bg-red-400': '#f87171',
};

const toHexColor = (color?: string): string => {
  if (!color) return '#818cf8';
  if (color.startsWith('#')) {
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
  }
  if (TAILWIND_COLOR_MAP[color]) return TAILWIND_COLOR_MAP[color];
  return '#818cf8';
};

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  onClose,
  board,
  onUpdateBoard,
  onDeleteBoard,
  onClearTasks,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'columns' | 'danger'>(
    initialTab === 'danger' ? 'danger' : initialTab === 'columns' ? 'columns' : 'general'
  );

  // General Tab States
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description);
  const [color, setColor] = useState(board.color || COLOR_OPTIONS[0].value);
  const [icon, setIcon] = useState(board.icon || 'Kanban');
  const [tagsInput, setTagsInput] = useState(Array.isArray(board.tags) ? board.tags.join(', ') : '');

  // Columns Tab States
  const [columns, setColumns] = useState<BoardColumn[]>([]);

  // Danger Zone States
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(
        initialTab === 'danger' ? 'danger' : initialTab === 'columns' ? 'columns' : 'general'
      );
      setTitle(board.title);
      setDescription(board.description);
      setColor(board.color || COLOR_OPTIONS[0].value);
      setIcon(board.icon || 'Kanban');
      setTagsInput(Array.isArray(board.tags) ? board.tags.join(', ') : '');
      
      const defaultCols: BoardColumn[] = [
        { id: 'col-todo', title: 'To Do', position: 0, statusKey: 'todo', colorDot: 'bg-slate-400' },
        { id: 'col-in-progress', title: 'In Progress', position: 1, statusKey: 'in-progress', colorDot: 'bg-indigo-400' },
        { id: 'col-done', title: 'Done', position: 2, statusKey: 'done', colorDot: 'bg-emerald-400' },
      ];
      setColumns(
        board.columns && board.columns.length > 0
          ? [...board.columns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          : defaultCols
      );

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

    const updated: Board = {
      ...board,
      title: title.trim() || board.title,
      description: description.trim(),
      color,
      icon,
      tags: cleanTags.length > 0 ? cleanTags : (Array.isArray(board.tags) ? board.tags : []),
      workspaceId: board.workspaceId,
      workspaceName: board.workspaceName,
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

  // Columns Tab Actions
  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[targetIdx];
    newCols[targetIdx] = temp;
    setColumns(newCols);
  };

  const handleUpdateColumnTitle = (index: number, newTitle: string) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], title: newTitle };
    setColumns(newCols);
  };

  const handleUpdateColumnColor = (index: number, newColor: string) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], colorDot: newColor };
    setColumns(newCols);
  };

  const handleAddColumn = () => {
    const newColId = `col_${Date.now()}`;
    const newCols: BoardColumn[] = [
      ...columns,
      {
        id: newColId,
        title: `Column ${columns.length + 1}`,
        position: columns.length,
        statusKey: `status-${Date.now()}`,
        colorDot: 'bg-indigo-400',
      },
    ];
    setColumns(newCols);
  };

  const handleDeleteColumn = (index: number) => {
    if (columns.length <= 1) {
      showError('Board must have at least one column');
      return;
    }
    const newCols = columns.filter((_, i) => i !== index);
    setColumns(newCols);
  };

  const handleSaveColumns = async (e: React.FormEvent) => {
    e.preventDefault();
    if (columns.some((c) => !c.title.trim())) {
      showError('All columns must have a title');
      return;
    }

    const normalizedColumns: BoardColumn[] = columns.map((c, idx) => ({
      ...c,
      title: c.title.trim(),
      position: idx,
      statusKey: c.statusKey || c.title.trim().toLowerCase().replace(/\s+/g, '-'),
    }));

    setIsSaving(true);
    try {
      await onUpdateBoard({
        ...board,
        columns: normalizedColumns,
      });
      showSuccess('Columns updated successfully!');
    } catch (err: any) {
      showError(err?.message || 'Failed to update columns');
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
              General configuration, workflow columns, and board controls
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
            onClick={() => setActiveTab('columns')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'columns'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ColumnsIcon className="w-3.5 h-3.5" />
            <span>Columns</span>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Board Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 text-white text-xs outline-hidden transition"
                placeholder="Project title..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 text-white text-xs outline-hidden transition resize-none"
                placeholder="What is this board for?"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Color Gradient
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-9 rounded-xl bg-linear-to-br ${c.value} flex items-center justify-center transition-all cursor-pointer ${
                      color === c.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105 shadow-md'
                        : 'opacity-70 hover:opacity-100 hover:scale-102'
                    }`}
                  >
                    {color === c.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Board Icon
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ICON_OPTIONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <IconComp className="w-4 h-4 mb-1" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Product, Design, Sprint 1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 text-white text-xs outline-hidden transition"
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

        {/* TAB 2: COLUMNS */}
        {activeTab === 'columns' && (
          <form onSubmit={handleSaveColumns} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">
                Customize column workflow, reorder, or add custom columns:
              </p>
              <button
                type="button"
                onClick={handleAddColumn}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Column</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1">
              {columns.map((col, idx) => (
                <div
                  key={col.id || col._id || idx}
                  className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition"
                >
                  {/* Position Buttons */}
                  <div className="flex flex-col space-y-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveColumn(idx, 'up')}
                      className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move column up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === columns.length - 1}
                      onClick={() => handleMoveColumn(idx, 'down')}
                      className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move column down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Direct Color Figure Picker */}
                  <label
                    className="relative w-6 h-6 rounded-full shrink-0 cursor-pointer ring-2 ring-slate-700/90 hover:ring-white hover:scale-110 transition-all shadow-md overflow-hidden flex items-center justify-center group"
                    style={{ backgroundColor: toHexColor(col.colorDot) }}
                    title="Click to pick any color"
                  >
                    <input
                      type="color"
                      value={toHexColor(col.colorDot)}
                      onChange={(e) => handleUpdateColumnColor(idx, e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      aria-label={`Change color for ${col.title || 'column'}`}
                    />
                    <Palette className="w-3 h-3 text-white/90 drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </label>

                  {/* Title Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => handleUpdateColumnTitle(idx, e.target.value)}
                      placeholder="Column name..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-hidden focus:border-indigo-500 transition font-medium"
                    />
                  </div>

                  {/* Delete Column Button */}
                  <button
                    type="button"
                    disabled={columns.length <= 1}
                    onClick={() => handleDeleteColumn(idx)}
                    title={columns.length <= 1 ? 'At least one column is required' : 'Delete column'}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
                <span>{isSaving ? 'Saving...' : 'Save Columns'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: DANGER ZONE */}
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
                    Delete all tasks across all columns on this board.
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
