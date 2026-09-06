import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Check,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import type { Workspace } from '../../types';
import { COLOR_OPTIONS } from '../../constants';

interface ManageWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace?: Workspace | null;
  onUpdateWorkspace: (updated: Workspace) => Promise<void> | void;
  onDeleteWorkspace?: (id: string) => void;
}

export const ManageWorkspaceModal: React.FC<ManageWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'danger'>('general');
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [color, setColor] = useState(workspace?.color || COLOR_OPTIONS[0].value);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description);
      setColor(workspace.color || COLOR_OPTIONS[0].value);
    }
    setConfirmDelete(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a workspace name.');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMessage('Workspace name must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const updated: Workspace = {
        ...workspace,
        name: name.trim() || workspace.name,
        description: description.trim(),
        color,
      };
      await onUpdateWorkspace(updated);
      setSuccessMessage('Workspace settings updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 600);
    } catch (err: any) {
      let msg = err.message || 'Failed to update workspace';
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        msg = err.details.map((d: any) => d.message || d.field).join('. ');
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (onDeleteWorkspace) {
      onDeleteWorkspace(workspace.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-100 ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        
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
            <p className="text-xs text-slate-400">Workspace Settings & Customization</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'danger'
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Danger Zone</span>
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
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Workspace Name <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
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
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Danger Zone */}
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
