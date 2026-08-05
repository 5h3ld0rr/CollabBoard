import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Shield,
  Eye,
  Edit3,
} from 'lucide-react';
import type { Board, User } from '../../types';
import { MOCK_USERS } from '../../data/mockData';

interface BoardMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateMembers: (newMembers: User[]) => void;
}

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

export const BoardMembersModal: React.FC<BoardMembersModalProps> = ({
  isOpen,
  onClose,
  board,
  onUpdateMembers,
}) => {
  const [members, setMembers] = useState<User[]>(() => {
    return board.members.map((m, idx) => ({
      ...m,
      boardRole: m.boardRole || (idx === 0 ? 'Admin' : 'Editor'),
    }));
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedWorkspaceUser, setSelectedWorkspaceUser] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Editor');
  const [copiedLink, setCopiedLink] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Find workspace teammates who are not yet added to this board
  const availableTeammates = MOCK_USERS.filter(
    (u) => !members.some((m) => m.id === u.id || m.email === u.email)
  );

  const handleCopyBoardLink = () => {
    const boardUrl = window.location.href;
    navigator.clipboard.writeText(boardUrl);
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
      onUpdateMembers(updatedMembers);
      setInviteEmail('');
      setSelectedWorkspaceUser('');
      setSuccessMessage(`Added ${userToAdd.name} to the board as ${inviteRole}!`);
      setTimeout(() => setSuccessMessage(null), 2500);
    }
  };

  const handleChangeRole = (userId: string, newRole: 'Admin' | 'Editor' | 'Viewer') => {
    const updatedMembers = members.map((m) =>
      m.id === userId ? { ...m, boardRole: newRole } : m
    );
    setMembers(updatedMembers);
    onUpdateMembers(updatedMembers);
  };

  const handleRemoveMember = (userId: string) => {
    if (members.length <= 1) return;
    const target = members.find((m) => m.id === userId);
    const updatedMembers = members.filter((m) => m.id !== userId);
    setMembers(updatedMembers);
    onUpdateMembers(updatedMembers);
    if (target) {
      setSuccessMessage(`Removed ${target.name} from board.`);
      setTimeout(() => setSuccessMessage(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 text-slate-100 ring-1 ring-white/10">
        
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

        {/* Shareable Board Link Strip */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 mb-6">
          <div className="flex-1 truncate text-xs text-slate-400 font-mono">
            {window.location.href}
          </div>
          <button
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
                      <p className="text-xs font-semibold text-white leading-tight truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Role Selector & Remove Action */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="relative">
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
                    </div>

                    {members.length > 1 && (
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
