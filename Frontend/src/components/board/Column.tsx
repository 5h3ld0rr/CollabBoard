import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../../types';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  colorDot: string;
  accentBadge: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
  readOnly?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  title,
  status,
  colorDot,
  accentBadge,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveStatus,
  onDropTask,
  readOnly = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    if (readOnly) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (readOnly) return;
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl bg-slate-900/60 border transition-all duration-200 w-full flex-1 min-w-0 p-4 shadow-sm ${
        isDragOver
          ? 'border-indigo-500 bg-slate-900/90 ring-2 ring-indigo-500/20'
          : 'border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${colorDot}`} />
          <h3 data-testid={`column-header-${status}`} className="font-bold text-xs uppercase tracking-wider text-slate-200">
            {title}
          </h3>
          <span
            data-testid={`column-task-count-${status}`}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${accentBadge}`}
          >
            {tasks.length}
          </span>
        </div>

        {!readOnly && (
          <button
            onClick={() => onAddTask(status)}
            title={`Add task to ${title}`}
            className="p-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Task Cards List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 min-h-37.5">
        {tasks.length === 0 ? (
          readOnly ? (
            <div className="h-24 rounded-xl border border-slate-800/60 bg-slate-950/20 flex items-center justify-center text-slate-500 text-xs">
              <span>No tasks</span>
            </div>
          ) : (
            <div
              onClick={() => onAddTask(status)}
              className="h-28 rounded-xl border-2 border-dashed border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-800/20 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition cursor-pointer text-xs space-y-1"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Drop card or click to add</span>
            </div>
          )
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMoveStatus={onMoveStatus}
              onDragStart={handleDragStart}
              readOnly={readOnly}
            />
          ))
        )}
      </div>

    </div>
  );
};
