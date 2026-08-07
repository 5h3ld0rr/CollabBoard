import React from 'react';
import { Link } from 'react-router-dom';
import {
  GripVertical,
  CheckCircle2,
  Calendar,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { MOCK_COMMENTS } from '../../data/mockData';
import type { Task, TaskPriority, TaskStatus } from '../../types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onMoveStatus?: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

const PRIORITY_BADGES: Record<TaskPriority, { label: string; bg: string; text: string; border: string }> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
  },
  high: {
    label: 'High',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
  },
  low: {
    label: 'Low',
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

export const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onDragStart,
}) => {
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;

  const isDone = task.status === 'done';
  const isOverdue =
    !isDone &&
    Boolean(task.dueDate) &&
    new Date(task.dueDate!).getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      className={`group relative rounded-xl border p-4 transition-all duration-150 shadow-sm select-none cursor-grab active:cursor-grabbing ${
        isDone
          ? 'bg-slate-800/50 hover:bg-slate-800/70 border-slate-700/40 hover:border-emerald-500/30 opacity-90'
          : isOverdue
          ? 'bg-slate-800/90 hover:bg-slate-800 border-rose-500/40 hover:border-rose-500/70 hover:shadow-lg hover:shadow-rose-950/30'
          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/30'
      }`}
    >
      {/* Top Strip: Priority / Done Badge & View Details Link */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isDone ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Done</span>
            </span>
          ) : isOverdue ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-rose-500/15 text-rose-300 border-rose-500/30">
              Overdue
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
            >
              {priorityInfo.label}
            </span>
          )}
        </div>

        {/* View Details Link */}
        <Link
          to={`/tasks/${task.id}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition cursor-pointer flex items-center"
          title="View Details"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Task Title */}
      <h4
        className={`text-sm font-semibold leading-snug mb-1.5 transition-colors ${
          isDone
            ? 'line-through text-slate-400 group-hover:text-slate-300'
            : 'text-white group-hover:text-indigo-200'
        }`}
      >
        {task.title}
      </h4>

      {/* Task Description (if any) */}
      {task.description && (
        <p
          className={`text-xs leading-relaxed line-clamp-2 mb-3 font-normal ${
            isDone ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {task.description}
        </p>
      )}

      {/* Tag Chips */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3.5">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-900/80 text-slate-400 border border-slate-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Assignee, Due Date & Comment Pill */}
      <div className="pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
        {/* Assignee */}
        <div className="flex items-center space-x-1.5">
          {task.assignee ? (
            <div
              title={task.assignee.name}
              className={`w-5 h-5 rounded-full ${task.assignee.color} text-white font-bold text-[9px] flex items-center justify-center ring-1 ring-slate-800`}
            >
              {task.assignee.initials}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 text-[9px] flex items-center justify-center">
              ?
            </div>
          )}
          <span className="text-[11px] truncate max-w-24">
            {task.assignee ? task.assignee.name.split(' ')[0] : 'Unassigned'}
          </span>
        </div>

        {/* Right side: Due Date & Comments */}
        <div className="flex items-center space-x-1.5">
          {task.dueDate && (
            <span
              title={isOverdue ? `Overdue: Due on ${task.dueDate}` : `Due date: ${task.dueDate}`}
              className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                isOverdue
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700/50'
              }`}
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>{task.dueDate.slice(5)}</span>
            </span>
          )}

          {Boolean(MOCK_COMMENTS[task.id]?.length) && (
            <span
              title={`${MOCK_COMMENTS[task.id].length} comments`}
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-900/80 text-indigo-300 border border-slate-700/50"
            >
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{MOCK_COMMENTS[task.id].length}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
