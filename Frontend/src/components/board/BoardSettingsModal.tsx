import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Users,
  AlertTriangle,
  Check,
  Trash2,
  UserPlus,
  Copy,
  Kanban,
  Layers,
  ShieldCheck,
  WifiOff,
  Activity,
  Sparkles,
  Shield,
  Edit3,
  Eye,
  RotateCcw,
} from 'lucide-react';
import type { Board, User } from '../../types';
import { MOCK_USERS } from '../../data/mockData';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateBoard: (updatedBoard: Board) => void;
  onDeleteBoard?: (boardId: string) => void;
  onClearTasks?: () => void;
  initialTab?: 'general' | 'members' | 'danger';
}

const COLOR_OPTIONS = [
  { label: 'Indigo & Violet', value: 'from-indigo-600 to-violet-600' },
  { label: 'Emerald & Teal', value: 'from-emerald-600 to-teal-600' },
  { label: 'Fuchsia & Pink', value: 'from-fuchsia-600 to-pink-600' },
  { label: 'Amber & Orange', value: 'from-amber-600 to-orange-600' },
  { label: 'Sky & Cyan', value: 'from-sky-600 to-cyan-600' },
];

const ICON_OPTIONS = [
  { name: 'Kanban', icon: Kanban, label: 'Board' },
  { name: 'Layers', icon: Layers, label: 'Layers' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Security' },
  { name: 'WifiOff', icon: WifiOff, label: 'Offline' },
  { name: 'Activity', icon: Activity, label: 'Activity' },
  { name: 'Sparkles', icon: Sparkles, label: 'Sprint' },
];

const ROLE_BADGES = {
  Admin: {
    label: 'Admin',
    icon: <Shield className="w-3 h-3 text-amber-400" />,
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  },
  Editor: {
    label: 'Editor',
    icon: <Edit3 className="w-3 h-3 text-indigo-400" />,
    color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  },
  Viewer: {
    label: 'Viewer',
    icon: <Eye className="w-3 h-3 text-slate-400" />,
    color: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  },
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
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'danger'>(initialTab);
  
  // General Tab States
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description);
  const [color, setColor] = useState(board.color || COLOR_OPTIONS[0].value);
  const [icon, setIcon] = useState(board.icon || 'Kanban');
  const [tagsInput, setTagsInput] = useState(board.tags.join(', '));

  // Members Tab States
  const [members, setMembers] = useState<User[]>(() => {
    return (board.members || []).map((m, idx) => ({
      ...m,
      boardRole: m.boardRole || (idx === 0 ? 'Admin' : 'Editor'),
    }));
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedWorkspaceUser, setSelectedWorkspaceUser] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Editor');
  const [copiedLink, setCopiedLink] = useState(false);

  // Danger Zone States
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTitle(board.title);
      setDescription(board.description);
      setColor(board.color || COLOR_OPTIONS[0].value);
      setIcon(board.icon || 'Kanban');
      setTagsInput(board.tags.join(', '));
      setMembers(
        (board.members || []).map((m, idx) => ({
          ...m,
          boardRole: m.boardRole || (idx === 0 ? 'Admin' : 'Editor'),
        }))
      );
      setConfirmDelete(false);
      setConfirmClear(false);
      setSuccessMessage(null);
    }
  }, [isOpen, board, initialTab]);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // General Tab Save
  const handleSaveGeneral = (e: React.FormEvent) => {
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
      tags: cleanTags.length > 0 ? cleanTags : board.tags,
      updatedAt: 'Just now',
    };

    onUpdateBoard(updated);
    showSuccess('Board general settings updated!');
  };

  // Member Actions
  const availableTeammates = MOCK_USERS.filter(
    (u) => !members.some((m) => m.id === u.id || m.email === u.email)
  );

  const handleCopyBoardLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    let userToAdd: User | null = null;

    if (selectedWorkspaceUser) {
      const found = MOCK_USERS.find((u) => u.id === selectedWorkspaceUser);
      if (found) {
        userToAdd = {
          ...found,
          boardRole: inviteRole,
        };
      }
    } else if (inviteEmail.trim()) {
      const email = inviteEmail.trim();
      const initials = email.slice(0, 2).toUpperCase();
      userToAdd = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email,
        initials,
        color: 'bg-indigo-600',
        boardRole: inviteRole,
      };
    }

    if (userToAdd) {
      const updatedMembers = [...members, userToAdd];
      setMembers(updatedMembers);
      onUpdateBoard({
        ...board,
        members: updatedMembers,
      });
      setInviteEmail('');
      setSelectedWorkspaceUser('');
      showSuccess(`Added ${userToAdd.name} as ${inviteRole}!`);
    }
  };

  const handleChangeRole = (userId: string, newRole: 'Admin' | 'Editor' | 'Viewer') => {
    const updatedMembers = members.map((m) =>
      m.id === userId ? { ...m, boardRole: newRole } : m
    );
    setMembers(updatedMembers);
    onUpdateBoard({
      ...board,
      members: updatedMembers,
    });
    showSuccess(`Updated member role to ${newRole}`);
  };

  const handleRemoveMember = (userId: string) => {
    if (members.length <= 1) return;
    const target = members.find((m) => m.id === userId);
    const updatedMembers = members.filter((m) => m.id !== userId);
    setMembers(updatedMembers);
    onUpdateBoard({
      ...board,
      members: updatedMembers,
    });
    if (target) {
      showSuccess(`Removed ${target.name} from board`);
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
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 text-slate-100 ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
              General configuration, team members, and board controls
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-1.5 rounded-xl transition ${
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
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
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
                    className={`w-8 h-8 rounded-lg bg-linear-to-br ${c.value} transition-all ${
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-5">
            {/* Shareable Board Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Shareable Board Link
              </label>
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-mono truncate">
                  {window.location.href}
                </span>
                <button
                  type="button"
                  onClick={handleCopyBoardLink}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white font-medium transition flex items-center space-x-1.5 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invite Form */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Invite Collaborator
              </label>
              <form onSubmit={handleAddMember} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  {availableTeammates.length > 0 ? (
                    <select
                      value={selectedWorkspaceUser}
                      onChange={(e) => {
                        setSelectedWorkspaceUser(e.target.value);
                        if (e.target.value) setInviteEmail('');
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select teammate or enter email below...</option>
                      {availableTeammates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Editor">Editor</option>
                      <option value="Admin">Admin</option>
                      <option value="Viewer">Viewer</option>
                    </select>

                    <button
                      type="submit"
                      disabled={!selectedWorkspaceUser && !inviteEmail.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md flex items-center space-x-1 shrink-0 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite</span>
                    </button>
                  </div>
                </div>

                {availableTeammates.length > 0 && !selectedWorkspaceUser && (
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Or enter new email address (e.g. alex@collabboard.io)"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </form>
            </div>

            {/* Members List */}
            <div>
              <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Active Board Members ({members.length})</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {members.map((member) => {
                  const currentRole = member.boardRole || 'Editor';
                  const badge = ROLE_BADGES[currentRole] || ROLE_BADGES.Editor;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="relative">
                          <div
                            className={`w-8 h-8 rounded-xl ${
                              member.color || 'bg-indigo-600'
                            } text-white font-bold text-xs flex items-center justify-center shadow-xs`}
                          >
                            {member.initials}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate leading-tight">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <select
                          value={currentRole}
                          onChange={(e) =>
                            handleChangeRole(
                              member.id,
                              e.target.value as 'Admin' | 'Editor' | 'Viewer'
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badge.color} bg-slate-900 cursor-pointer focus:outline-none`}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Editor">Editor</option>
                          <option value="Viewer">Viewer</option>
                        </select>

                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Remove member from board"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
                    Delete all tasks across To Do, In Progress, and Done columns on this board.
                  </p>
                </div>
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition shrink-0"
                  >
                    Clear Tasks
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearTasks}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
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
                    Once deleted, all cards, column states, and member permissions associated with &ldquo;{board.title}&rdquo; will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    Delete Board
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-rose-300 font-medium">Are you sure?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteBoard}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/50"
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
