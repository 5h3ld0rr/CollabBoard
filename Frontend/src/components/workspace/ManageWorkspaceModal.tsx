import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Users,
  Trash2,
  UserPlus,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { Workspace, User } from '../../types';
import { MOCK_USERS, COLOR_OPTIONS } from '../../data/mockData';

interface ManageWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onUpdateWorkspace: (updated: Workspace) => void;
  onDeleteWorkspace?: (id: string) => void;
}

export const ManageWorkspaceModal: React.FC<ManageWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'danger'>('general');
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [color, setColor] = useState(workspace.color || COLOR_OPTIONS[0].value);
  const [members, setMembers] = useState<User[]>(workspace.members || [MOCK_USERS[0]]);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(workspace.name);
    setDescription(workspace.description);
    setColor(workspace.color || COLOR_OPTIONS[0].value);
    setMembers(workspace.members || [MOCK_USERS[0]]);
    setConfirmDelete(false);
    setSuccessMessage(null);
  }, [workspace, isOpen]);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Workspace = {
      ...workspace,
      name: name.trim() || workspace.name,
      description: description.trim(),
      color,
      members,
      memberCount: members.length,
    };
    onUpdateWorkspace(updated);
    onClose();
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const initials = inviteEmail
      .split('@')[0]
      .slice(0, 2)
      .toUpperCase();

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      initials,
      color: 'bg-indigo-600',
      role: inviteRole,
    };

    const newMembers = [...members, newUser];
    setMembers(newMembers);
    setInviteEmail('');
    
    const updated: Workspace = {
      ...workspace,
      members: newMembers,
      memberCount: newMembers.length,
    };
    onUpdateWorkspace(updated);
    setSuccessMessage(`Invited ${inviteEmail} as ${inviteRole}!`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleRemoveMember = (userId: string) => {
    if (members.length <= 1) return;
    const newMembers = members.filter((m) => m.id !== userId);
    setMembers(newMembers);
    const updated: Workspace = {
      ...workspace,
      members: newMembers,
      memberCount: newMembers.length,
    };
    onUpdateWorkspace(updated);
  };

  const handleChangeRole = (userId: string, newRole: 'Admin' | 'Member') => {
    const updatedMembers = members.map((m) =>
      m.id === userId ? { ...m, role: newRole } : m
    );
    setMembers(updatedMembers);
    const updated: Workspace = {
      ...workspace,
      members: updatedMembers,
      memberCount: updatedMembers.length,
    };
    onUpdateWorkspace(updated);
    const target = members.find((m) => m.id === userId);
    setSuccessMessage(`Updated role for ${target ? target.name : 'member'} to ${newRole}`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleDelete = () => {
    if (onDeleteWorkspace) {
      onDeleteWorkspace(workspace.id);
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
            <h2 className="text-xl font-bold text-white">{workspace.name}</h2>
            <p className="text-xs text-slate-400">Workspace Settings, Roles & Collaborators</p>
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

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Workspace Theme
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

        {/* Tab 2: Members & Roles */}
        {activeTab === 'members' && (
          <div className="space-y-5">
            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="flex gap-2 items-center">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@collabboard.io"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Member')}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </form>

            {/* Member List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg ${
                        member.color || 'bg-indigo-600'
                      } text-white font-bold text-[10px] flex items-center justify-center`}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{member.name}</p>
                      <p className="text-[10px] text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={member.role === 'Admin' ? 'Admin' : 'Member'}
                      onChange={(e) =>
                        handleChangeRole(
                          member.id,
                          e.target.value as 'Admin' | 'Member'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 border border-slate-700 text-indigo-300 hover:border-indigo-500 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>

                    {members.length > 1 && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Danger Zone */}
        {activeTab === 'danger' && (
          <div className="space-y-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-300">Delete Workspace</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Permanently remove this workspace and dissociate its boards. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-rose-500/20 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
                >
                  Delete Workspace
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
