import { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import type { Board, User } from '../../types';
import { PLAN_LIMITS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getProfileGradient } from '../../utils';
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

const normalizeMember = (m: any, idx: number, ownerId?: string, currentUser?: User | null): User => {
  const memberId = typeof m === 'object' && m !== null ? String(m.id) : String(m);
  const isOwner = Boolean(ownerId ? memberId === String(ownerId) : idx === 0);
  const isSelf = Boolean(
    currentUser &&
      (memberId === String(currentUser.id) ||
        (m?.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase()))
  );

  if (typeof m === 'object' && m !== null) {
    return {
      ...m,
      id: memberId,
      name: m.name || '',
      email: m.email || '',
      initials: m.initials || (m.name ? m.name.slice(0, 2).toUpperCase() : ''),
      color: isSelf && currentUser?.color ? currentUser.color : m.color,
      boardRole: isOwner ? 'Owner' : (m.boardRole || 'Editor'),
    };
  }

  return {
    id: memberId,
    name: '',
    email: '',
    initials: '',
    color: '',
    boardRole: isOwner ? 'Owner' : 'Editor',
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
  const deduplicateMembers = useCallback(
    (userList: any[]) => {
      const raw = userList.map((m, i) => normalizeMember(m, i, board.ownerId, currentUser));
      const seen = new Set<string>();
      return raw.filter((m) => {
        const idKey = String(m.id);
        const emailKey = m.email ? m.email.toLowerCase() : null;
        if (seen.has(idKey) || (emailKey && seen.has(emailKey))) {
          return false;
        }
        seen.add(idKey);
        if (emailKey) seen.add(emailKey);
        return true;
      });
    },
    [board.ownerId, currentUser]
  );

  const [members, setMembers] = useState<User[]>(() => deduplicateMembers(board.members || []));

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedWorkspaceUser, setSelectedWorkspaceUser] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Editor');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro = currentUser?.subscriptionPlan === 'pro';
  const isCollaboratorLimitReached =
    !isPro && members.length >= PLAN_LIMITS.basic.maxCollaboratorsPerBoard;

  useEffect(() => {
    if (isOpen) {
      setMembers(deduplicateMembers(board.members || []));
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, board.members, deduplicateMembers]);

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
    setErrorMessage(null);

    if (isCollaboratorLimitReached) {
      setErrorMessage(
        `Collaborator limit reached (${members.length}/${PLAN_LIMITS.basic.maxCollaboratorsPerBoard} on Basic plan). Upgrade to Pro for unlimited collaborators.`
      );
      return;
    }

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
      const email = inviteEmail.trim().toLowerCase();
      // Check if this matches a known workspace teammate
      const matchingTeammate = (workspaceMembers || []).find(
        (wm) => wm.email?.toLowerCase() === email
      );

      if (matchingTeammate) {
        userToAdd = {
          ...matchingTeammate,
          boardRole: inviteRole,
        };
      } else {
        const initials = email.slice(0, 2).toUpperCase();
        userToAdd = {
          id: email,
          name: email.split('@')[0],
          email,
          initials,
          color: 'bg-indigo-600',
          boardRole: inviteRole,
        };
      }
    }

    if (userToAdd) {
      const userEmail = userToAdd.email?.toLowerCase() || '';
      const userId = String(userToAdd.id);

      // Check if this is the board owner or current user
      if (
        (board.ownerId && (userId === String(board.ownerId) || (currentUser && userId === String(currentUser.id)))) ||
        (currentUser?.email && userEmail === currentUser.email.toLowerCase())
      ) {
        setErrorMessage('You are already the owner of this board.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      // Check if already in board members
      if (
        (userEmail && memberEmailSet.has(userEmail)) ||
        memberIdSet.has(userId)
      ) {
        setErrorMessage('This user is already a member of this board.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      const updatedMembers = [...members, userToAdd];
      setMembers(updatedMembers);
      try {
        await onUpdateMembers(updatedMembers);
        setInviteEmail('');
        setSelectedWorkspaceUser('');
        setSuccessMessage(`Added ${userToAdd.name} to the board as ${inviteRole}!`);
        setTimeout(() => setSuccessMessage(null), 2500);
      } catch (err: any) {
        setMembers(members); // revert optimistic update
        setErrorMessage(err?.message || 'Failed to add member to board.');
        setTimeout(() => setErrorMessage(null), 3500);
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

        {/* Collaborator Limit Reached Banner */}
        {isCollaboratorLimitReached && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start space-x-2.5">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Collaborator Limit Reached ({members.length}/{PLAN_LIMITS.basic.maxCollaboratorsPerBoard})
                </p>
                <p className="text-amber-300/80 text-[11px] mt-0.5">
                  The Basic plan allows up to 5 collaborators per board. Upgrade to Pro for unlimited team members and guests.
                </p>
              </div>
            </div>
            <a
              href="/profile?tab=subscription"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Crown className="w-3 h-3" />
              <span>Upgrade to Pro</span>
            </a>
          </div>
        )}

        {/* Feedback Alert */}
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

        {/* Add Member Form */}
        <div className="mb-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Invite Teammate to Board
          </label>

          <form onSubmit={handleAddMember} className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {availableTeammates.length > 0 ? (
                <div className="flex-1 flex gap-2">
                  <select
                    aria-label="Select teammate to invite"
                    value={selectedWorkspaceUser}
                    disabled={isCollaboratorLimitReached}
                    onChange={(e) => {
                      setSelectedWorkspaceUser(e.target.value);
                      if (e.target.value) setInviteEmail('');
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isCollaboratorLimitReached}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@collabboard.io"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}

              <div className="flex items-center gap-2">
                <select
                  aria-label="Invite role"
                  value={inviteRole}
                  disabled={isCollaboratorLimitReached}
                  onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>

                <button
                  type="submit"
                  disabled={isCollaboratorLimitReached || (!selectedWorkspaceUser && !inviteEmail.trim())}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md flex items-center space-x-1 shrink-0 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isCollaboratorLimitReached ? 'Limit Reached' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Quick email alternative if select dropdown is shown */}
            {availableTeammates.length > 0 && !selectedWorkspaceUser && (
              <input
                type="email"
                value={inviteEmail}
                disabled={isCollaboratorLimitReached}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Or enter new email (e.g. teammate@domain.com)"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            )}
          </form>
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
                        className={`w-8 h-8 rounded-xl ${getProfileGradient(
                          member.color,
                          member.name
                        )} text-white font-bold text-xs flex items-center justify-center shadow-xs`}
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
