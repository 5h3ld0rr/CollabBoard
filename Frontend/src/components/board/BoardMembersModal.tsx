import { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Check,
  Shield,
  Eye,
  Edit3,
  Crown,
} from 'lucide-react';
import type { Board, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TemporaryLinkGenerator } from './TemporaryLinkGenerator';

interface BoardMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateMembers: (newMembers: User[]) => void | Promise<void>;
  workspaceMembers?: User[];
}

const ROLE_BADGES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Owner: {
    label: 'Owner',
    icon: <Crown className="w-3 h-3 text-amber-400" />,
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  },
  Admin: {
    label: 'Admin',
    icon: <Shield className="w-3 h-3 text-sky-400" />,
    color: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
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

const normalizeMember = (m: any, idx: number, ownerId?: string): User => {
  const memberId = typeof m === 'object' && m !== null ? String(m.id) : String(m);
  const isOwner = Boolean(ownerId ? memberId === String(ownerId) : idx === 0);

  if (typeof m === 'object' && m !== null && m.name) {
    return {
      ...m,
      id: memberId,
      boardRole: isOwner ? 'Owner' : (m.boardRole || 'Editor'),
    };
  }
  const id = memberId;
  const name =
    id === '1' ? 'Alex Chen' :
    id === '2' ? 'Clara Tanaka' :
    id === '3' ? 'Elena Rostova' :
    id === '4' ? 'Marcus Vance' : `User ${id}`;
  const email =
    id === '1' ? 'user1@nsbm.lk' :
    id === '2' ? 'user2@nsbm.lk' :
    id === '3' ? 'user3@nsbm.lk' :
    id === '4' ? 'user4@nsbm.lk' : `user${id}@nsbm.lk`;
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const color = id === '1' ? 'bg-indigo-600' : id === '2' ? 'bg-emerald-600' : 'bg-fuchsia-600';

  return {
    id: String(id),
    name,
    email,
    initials,
    color,
    boardRole: isOwner ? 'Owner' : (idx === 0 ? 'Admin' : 'Editor'),
  };
};

export const BoardMembersModal: React.FC<BoardMembersModalProps> = ({
  isOpen,
  onClose,
  board,
  onUpdateMembers,
  workspaceMembers = [],
}) => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<User[]>(() => {
    return (board.members || []).map((m, i) => normalizeMember(m, i, board.ownerId));
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedWorkspaceUser, setSelectedWorkspaceUser] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Editor');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMembers((board.members || []).map((m, i) => normalizeMember(m, i, board.ownerId)));
      setSuccessMessage(null);
    }
  }, [isOpen, board]);

  if (!isOpen) return null;

  // Find workspace teammates who are not yet added to this board
  const memberIdSet = new Set(members.map((m) => String(m.id)));
  const memberEmailSet = new Set(
    members.map((m) => m.email?.toLowerCase()).filter(Boolean)
  );
  const availableTeammates: User[] = (workspaceMembers || []).filter(
    (wm) =>
      !memberIdSet.has(String(wm.id)) &&
      (!wm.email || !memberEmailSet.has(wm.email.toLowerCase()))
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    let userToAdd: User | null = null;

    if (selectedWorkspaceUser) {
      const selected = availableTeammates.find((u) => u.id === selectedWorkspaceUser);
      if (selected) {
        userToAdd = {
          ...selected,
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
      try {
        await onUpdateMembers(updatedMembers);
        setInviteEmail('');
        setSelectedWorkspaceUser('');
        setSuccessMessage(`Added ${userToAdd.name} to the board as ${inviteRole}!`);
        setTimeout(() => setSuccessMessage(null), 2500);
      } catch {
        setSuccessMessage(null);
      }
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'Admin' | 'Editor' | 'Viewer') => {
    if (board.ownerId && userId === String(board.ownerId)) return;
    if (currentUser && (userId === currentUser.id || userId === String(currentUser.id))) return;

    const updatedMembers = members.map((m) =>
      m.id === userId ? { ...m, boardRole: newRole } : m
    );
    setMembers(updatedMembers);
    await onUpdateMembers(updatedMembers);
  };

  const handleRemoveMember = async (userId: string) => {
    if (members.length <= 1) return;
    if (board.ownerId && userId === String(board.ownerId)) return;
    if (currentUser && (userId === currentUser.id || userId === String(currentUser.id))) return;

    const target = members.find((m) => m.id === userId);
    const updatedMembers = members.filter((m) => m.id !== userId);
    setMembers(updatedMembers);
    await onUpdateMembers(updatedMembers);
    if (target) {
      setSuccessMessage(`Removed ${target.name} from board.`);
      setTimeout(() => setSuccessMessage(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-100 ring-1 ring-white/10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Board Collaborators</h2>
            <p className="text-xs text-slate-400">
              Manage member roles and permissions for &ldquo;{board.title}&rdquo;
            </p>
          </div>
        </div>

        {/* Temporary View-Only Share Link Generator */}
        <div className="mb-6">
          <TemporaryLinkGenerator boardId={board.id} />
        </div>

        {/* Feedback Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Add Member Form */}
        <div className="mb-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Invite Teammate to Board
          </label>

          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
            {availableTeammates.length > 0 ? (
              <div className="flex-1 flex gap-2">
                <select
                  aria-label="Select teammate to invite"
                  value={selectedWorkspaceUser}
                  onChange={(e) => {
                    setSelectedWorkspaceUser(e.target.value);
                    if (e.target.value) setInviteEmail('');
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select teammate or type email below...</option>
                  {availableTeammates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@collabboard.io"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}

            <div className="flex items-center gap-2">
              <select
                aria-label="Invite role"
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
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md flex items-center space-x-1 shrink-0 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Quick email alternative if select dropdown is shown */}
          {availableTeammates.length > 0 && !selectedWorkspaceUser && (
            <div className="pt-1">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Or enter new email (e.g. teammate@domain.com)"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Active Board Members List */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Board Members</span>
            <span>{members.length} Total</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {members.map((member) => {
              const isOwner = Boolean(
                (board.ownerId && member.id === String(board.ownerId)) ||
                member.boardRole === 'Owner'
              );
              const isSelf = Boolean(
                currentUser &&
                (member.id === currentUser.id ||
                 member.id === String(currentUser.id) ||
                 (member.email && currentUser.email && member.email.toLowerCase() === currentUser.email.toLowerCase()))
              );
              const currentRole = isOwner ? 'Owner' : (member.boardRole || 'Editor');
              const badge = ROLE_BADGES[currentRole] || ROLE_BADGES.Editor;

              // Guard against self role change and owner role change
              const canChangeRole = !isOwner && !isSelf;
              const canRemove = !isOwner && !isSelf && members.length > 1;

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
                      <div className="flex items-center space-x-1.5">
                        <p className="text-xs font-semibold text-white leading-tight truncate">
                          {member.name}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Role Selector & Remove Action */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {canChangeRole ? (
                      <div className="relative">
                        <select
                          aria-label={`Role for ${member.name}`}
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
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badge.color} bg-slate-900 select-none`}
                        title={isOwner ? 'Board Owner (Role is fixed)' : 'You cannot change your own role'}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    )}

                    {canRemove && (
                      <button
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

        {/* Footer */}
        <div className="flex items-center justify-end pt-5 mt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
