import React, { useState } from 'react';
import {
  MoreHorizontal,
  Trash2,
  Edit2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
} from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
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

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onMoveStatus,
  onDragStart,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;

  const handleNextStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'todo') onMoveStatus(task.id, 'in-progress');
    else if (task.status === 'in-progress') onMoveStatus(task.id, 'done');
  };

  const handlePrevStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'done') onMoveStatus(task.id, 'in-progress');
    else if (task.status === 'in-progress') onMoveStatus(task.id, 'todo');
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      className="group relative rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 p-4 transition-all duration-150 shadow-sm hover:shadow-lg hover:shadow-indigo-950/30 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top Strip: Priority Badge & Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
          >
            {priorityInfo.label}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(task.id);
                }}
                className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-white leading-snug mb-1.5 group-hover:text-indigo-200 transition-colors">
        {task.title}
      </h4>

      {/* Task Description (if any) */}
      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 font-normal">
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

      {/* Card Footer: Assignee & Quick Move Buttons */}
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
          <span className="text-[11px] truncate max-w-[90px]">
            {task.assignee ? task.assignee.name.split(' ')[0] : 'Unassigned'}
          </span>
        </div>

        {/* Quick Shift buttons */}
        <div className="flex items-center space-x-1">
          {task.status !== 'todo' && (
            <button
              onClick={handlePrevStatus}
              title="Move left"
              className="p-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={handleNextStatus}
              title="Move right"
              className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white transition border border-indigo-500/30"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
