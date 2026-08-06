import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Kanban,
  WifiOff,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import type { Board } from '../../types';

interface BoardCardProps {
  board: Board;
  onToggleFavorite: (id: string) => void;
}

export const BoardCard: React.FC<BoardCardProps> = React.memo(({
  board,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  // Icon Resolver
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'WifiOff':
        return <WifiOff className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Kanban':
      default:
        return <Kanban className="w-5 h-5" />;
    }
  };

  const progressPercent =
    board.stats.totalTasks > 0
      ? Math.round((board.stats.doneCount / board.stats.totalTasks) * 100)
      : 0;

  const handleCardClick = () => {
    navigate(`/boards/${board.id}`);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(board.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-indigo-950/20 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Icon, Tags & Favorite */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${board.color} text-white flex items-center justify-center shadow-md`}
            >
              {renderIcon(board.icon)}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {board.workspaceName}
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-1">
                {board.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleStarClick}
            title={board.isFavorite ? 'Remove from starred' : 'Star this board'}
            className={`p-1.5 rounded-lg border transition-all ${
              board.isFavorite
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                board.isFavorite ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
          {board.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {board.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Progress & Member Avatars */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col space-y-3">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Progress</span>
            <span className="font-mono text-slate-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Bottom Strip: Updated timestamp + Member Avatars */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{board.updatedAt}</span>
          </div>

          <div className="flex items-center -space-x-1.5">
            {board.members.map((member) => (
              <div
                key={member.id}
                title={member.name}
                className={`w-6 h-6 rounded-full ${member.color} text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-slate-900 shadow-sm`}
              >
                {member.initials}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
