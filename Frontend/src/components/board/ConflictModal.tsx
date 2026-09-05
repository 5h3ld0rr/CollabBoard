import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ArrowRight,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Task, User } from '../../types';

export interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  localTask: Task;
  serverTask: Task;
  onOverwrite: (resolvedTask: Task) => Promise<void>;
  onDiscard: (serverTask: Task) => void;
  onMerge: (mergedTask: Task) => Promise<void>;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  localTask,
  serverTask,
  onOverwrite,
  onDiscard,
  onMerge,
}) => {
  const [activeTab, setActiveTab] = useState<'compare' | 'merge'>('compare');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field-level selection state for custom merge
  const [selectedFields, setSelectedFields] = useState<Record<string, 'local' | 'server'>>({
    title: 'local',
    description: 'local',
    status: 'local',
    priority: 'local',
    assignee: 'local',
    dueDate: 'local',
  });

  if (!isOpen) return null;

  const getAssigneeName = (u?: User | string): string => {
    if (!u) return 'Unassigned';
    if (typeof u === 'object') return u.name || u.initials || 'User';
    return String(u);
  };

  const isFieldDifferent = (field: keyof Task): boolean => {
    if (field === 'assignee') {
      const a1 = getAssigneeName(localTask.assignee);
      const a2 = getAssigneeName(serverTask.assignee);
      return a1 !== a2;
    }
    return localTask[field] !== serverTask[field];
  };

  const handleOverwrite = async () => {
    setIsSubmitting(true);
    try {
      // Overwrite with local changes but using the latest server version as baseVersion
      const resolved: Task = {
        ...localTask,
        version: serverTask.version,
      };
      await onOverwrite(resolved);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    onDiscard(serverTask);
    onClose();
  };

  const handleApplyMerge = async () => {
    setIsSubmitting(true);
    try {
      const merged: Task = {
        ...serverTask,
        title: selectedFields.title === 'local' ? localTask.title : serverTask.title,
        description:
          selectedFields.description === 'local' ? localTask.description : serverTask.description,
        status: selectedFields.status === 'local' ? localTask.status : serverTask.status,
        priority: selectedFields.priority === 'local' ? localTask.priority : serverTask.priority,
        assignee: selectedFields.assignee === 'local' ? localTask.assignee : serverTask.assignee,
        dueDate: selectedFields.dueDate === 'local' ? localTask.dueDate : serverTask.dueDate,
        version: serverTask.version, // Use server version as base to avoid another OCC rejection
        updatedAt: new Date().toISOString(),
      };
      await onMerge(merged);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-100 ring-1 ring-amber-500/20 max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Version Conflict Detected (409)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                OCC Protected
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Another collaborator updated this task on the server while you were making edits.
              Compare the changes below and select how you would like to reconcile the versions.
            </p>
          </div>
        </div>

        {/* Version Badge Bar */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-xs font-semibold text-slate-300">Your Local Edits</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
              v{localTask.version ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Server Latest</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              v{serverTask.version ?? 0}
            </span>
          </div>
        </div>

        {/* Tabs: Side-by-Side Review vs Field Merge */}
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'compare'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side Review</span>
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'merge'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Field Merge</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-[220px] max-h-[340px]">
          {activeTab === 'compare' ? (
            <div className="space-y-3">
              {/* Title Field */}
              <div
                className={`p-3.5 rounded-2xl border transition ${
                  isFieldDifferent('title')
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Title</span>
                  {isFieldDifferent('title') && (
                    <span className="text-amber-400 font-semibold text-[10px]">Modified</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-blue-400 block mb-1 font-semibold">Yours:</span>
                    <p className="text-slate-200 font-medium">{localTask.title || '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-emerald-400 block mb-1 font-semibold">Server:</span>
                    <p className="text-slate-200 font-medium">{serverTask.title || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status */}
                <div
                  className={`p-3.5 rounded-2xl border transition ${
                    isFieldDifferent('status')
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Status</span>
                    {isFieldDifferent('status') && (
                      <span className="text-amber-400 font-semibold text-[10px]">Modified</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-blue-400 block mb-0.5">Yours</span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {localTask.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-emerald-400 block mb-0.5">Server</span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {serverTask.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div
                  className={`p-3.5 rounded-2xl border transition ${
                    isFieldDifferent('priority')
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Priority</span>
                    {isFieldDifferent('priority') && (
                      <span className="text-amber-400 font-semibold text-[10px]">Modified</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-blue-400 block mb-0.5">Yours</span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {localTask.priority}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-emerald-400 block mb-0.5">Server</span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {serverTask.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Field */}
              <div
                className={`p-3.5 rounded-2xl border transition ${
                  isFieldDifferent('description')
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Description</span>
                  {isFieldDifferent('description') && (
                    <span className="text-amber-400 font-semibold text-[10px]">Modified</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-blue-400 block mb-1 font-semibold">Yours:</span>
                    <p className="text-slate-300 whitespace-pre-wrap line-clamp-3">
                      {localTask.description || '—'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-emerald-400 block mb-1 font-semibold">Server:</span>
                    <p className="text-slate-300 whitespace-pre-wrap line-clamp-3">
                      {serverTask.description || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignee & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-2xl border transition ${
                    isFieldDifferent('assignee')
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Assignee</span>
                    {isFieldDifferent('assignee') && (
                      <span className="text-amber-400 font-semibold text-[10px]">Modified</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-blue-400 block">Yours:</span>
                      <span className="font-medium text-slate-200 truncate block">
                        {getAssigneeName(localTask.assignee)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-emerald-400 block">Server:</span>
                      <span className="font-medium text-slate-200 truncate block">
                        {getAssigneeName(serverTask.assignee)}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border transition ${
                    isFieldDifferent('dueDate')
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Due Date</span>
                    {isFieldDifferent('dueDate') && (
                      <span className="text-amber-400 font-semibold text-[10px]">Modified</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-blue-400 block">Yours:</span>
                      <span className="font-medium text-slate-200 truncate block">
                        {localTask.dueDate || 'None'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-emerald-400 block">Server:</span>
                      <span className="font-medium text-slate-200 truncate block">
                        {serverTask.dueDate || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Merge Mode: User selects field-by-field */
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Click on the version you wish to keep for each field:
              </p>

              {[
                { key: 'title', label: 'Title', localVal: localTask.title, serverVal: serverTask.title },
                {
                  key: 'status',
                  label: 'Status',
                  localVal: localTask.status,
                  serverVal: serverTask.status,
                },
                {
                  key: 'priority',
                  label: 'Priority',
                  localVal: localTask.priority,
                  serverVal: serverTask.priority,
                },
                {
                  key: 'description',
                  label: 'Description',
                  localVal: localTask.description || '—',
                  serverVal: serverTask.description || '—',
                },
                {
                  key: 'assignee',
                  label: 'Assignee',
                  localVal: getAssigneeName(localTask.assignee),
                  serverVal: getAssigneeName(serverTask.assignee),
                },
                {
                  key: 'dueDate',
                  label: 'Due Date',
                  localVal: localTask.dueDate || 'None',
                  serverVal: serverTask.dueDate || 'None',
                },
              ].map((item) => {
                const isSelectedLocal = selectedFields[item.key] === 'local';
                const hasDiff = item.localVal !== item.serverVal;

                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-2xl border ${
                      hasDiff ? 'border-indigo-500/30 bg-slate-950/60' : 'border-slate-800 bg-slate-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>{item.label}</span>
                      {hasDiff && (
                        <span className="text-[10px] text-indigo-400 font-medium">Select winner:</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFields((prev) => ({ ...prev, [item.key]: 'local' }))
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                          isSelectedLocal
                            ? 'bg-blue-600/20 border-blue-500/60 text-white ring-1 ring-blue-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-400">YOURS</span>
                          {isSelectedLocal && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="truncate font-medium">{String(item.localVal)}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFields((prev) => ({ ...prev, [item.key]: 'server' }))
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                          !isSelectedLocal
                            ? 'bg-emerald-600/20 border-emerald-500/60 text-white ring-1 ring-emerald-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-400">SERVER</span>
                          {!isSelectedLocal && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="truncate font-medium">{String(item.serverVal)}</p>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Discard My Changes & Use Server</span>
          </button>

          <div className="flex items-center space-x-2">
            {activeTab === 'merge' ? (
              <button
                type="button"
                onClick={handleApplyMerge}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Merging...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Merged Version</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOverwrite}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-semibold shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Overwriting...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Force Overwrite (Use Mine)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
