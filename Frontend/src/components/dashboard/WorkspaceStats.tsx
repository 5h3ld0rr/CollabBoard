import React from 'react';
import { Kanban, Clock, CheckCircle2, Users } from 'lucide-react';
import type { Board } from '../../types';

interface WorkspaceStatsProps {
  boards: Board[];
  workspaceCount?: number;
  workspaceName?: string;
}

export const WorkspaceStats: React.FC<WorkspaceStatsProps> = ({
  boards,
  workspaceCount,
  workspaceName,
}) => {
  const totalBoards = boards.length;
  const totalTasks = boards.reduce((acc, b) => acc + (b.stats?.totalTasks || 0), 0);
  const inProgressTasks = boards.reduce((acc, b) => acc + (b.stats?.inProgressCount || 0), 0);
  const completedTasks = boards.reduce((acc, b) => acc + (b.stats?.doneCount || 0), 0);

  // Compute unique collaborators dynamically across all accessible boards
  const collaboratorIds = new Set<string>();
  boards.forEach((b) => {
    if (Array.isArray(b.members)) {
      b.members.forEach((m) => {
        if (typeof m === 'string') {
          collaboratorIds.add(m);
        } else if (m && typeof m === 'object' && 'id' in m) {
          collaboratorIds.add(String((m as { id: string }).id));
        }
      });
    }
  });
  const totalCollaborators = Math.max(collaboratorIds.size, 1);

  const activeBoardsSubtext = workspaceName
    ? `in ${workspaceName}`
    : workspaceCount !== undefined
    ? `across ${workspaceCount} workspace${workspaceCount === 1 ? '' : 's'}`
    : 'in active workspace';

  const stats = [
    {
      label: 'Active Boards',
      value: totalBoards,
      subtext: activeBoardsSubtext,
      icon: <Kanban className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Tasks In Flight',
      value: inProgressTasks,
      subtext: `${totalTasks} total tasks registered`,
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Completed Tasks',
      value: completedTasks,
      subtext: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Collaborators',
      value: totalCollaborators,
      subtext: 'Real-time presence active',
      icon: <Users className="w-5 h-5 text-sky-400" />,
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-sm flex items-start justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stat.value}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {stat.subtext}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl border ${stat.bg} flex items-center justify-center shrink-0`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
