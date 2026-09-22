import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../../types';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  columnId?: string;
  colorDot: string;
  accentBadge?: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus, columnId?: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDropTask: (
    taskId: string,
    targetStatus: TaskStatus,
    targetIndex?: number,
    targetColumnId?: string
  ) => void;
  readOnly?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  title,
  status,
  columnId,
  colorDot,
  accentBadge = 'bg-slate-800 text-slate-300',
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveStatus,
  onDropTask,
  readOnly = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropIndex(null);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const targetIdx = e.clientY < midY ? index : index + 1;
    setDropIndex(targetIdx);
    setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const finalIndex = dropIndex;
    setIsDragOver(false);
    setDropIndex(null);
    if (taskId) {
      if (typeof finalIndex === 'number' && columnId) {
        onDropTask(taskId, status, finalIndex, columnId);
      } else if (typeof finalIndex === 'number') {
        onDropTask(taskId, status, finalIndex);
      } else {
        onDropTask(taskId, status);
      }
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
      className={`flex flex-col rounded-2xl bg-slate-900/60 border transition-all duration-200 w-full flex-1 min-w-70 p-4 shadow-sm ${
        isDragOver
          ? 'border-indigo-500 bg-slate-900/90 ring-2 ring-indigo-500/20'
          : 'border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              !colorDot?.startsWith('#') && !colorDot?.startsWith('rgb') ? colorDot : ''
            }`}
            style={
              colorDot?.startsWith('#') || colorDot?.startsWith('rgb')
                ? { backgroundColor: colorDot }
                : undefined
            }
          />
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
            onClick={() => (columnId ? onAddTask(status, columnId) : onAddTask(status))}
            title={`Add task to ${title}`}
            className="p-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Task Cards List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 min-h-37.5">
        {isDragOver && dropIndex === 0 && (
          <div className="h-1.5 bg-indigo-500 rounded-full my-1 shadow-sm ring-2 ring-indigo-400/50 animate-pulse transition-all" />
        )}

        {tasks.length === 0 ? (
          readOnly ? (
            <div className="h-24 rounded-xl border border-slate-800/60 bg-slate-950/20 flex items-center justify-center text-slate-500 text-xs">
              <span>No tasks</span>
            </div>
          ) : (
            <div
              onClick={() => (columnId ? onAddTask(status, columnId) : onAddTask(status))}
              className="h-28 rounded-xl border-2 border-dashed border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-800/20 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition cursor-pointer text-xs space-y-1"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Drop card or click to add</span>
            </div>
          )
        ) : (
          tasks.map((task, idx) => (
            <div
              key={task.id}
              onDragOver={(e) => handleCardDragOver(e, idx)}
              className="relative"
            >
              <TaskCard
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onMoveStatus={onMoveStatus}
                onDragStart={handleDragStart}
                readOnly={readOnly}
              />
              {isDragOver && dropIndex === idx + 1 && (
                <div className="h-1.5 bg-indigo-500 rounded-full mt-2.5 mb-1 shadow-sm ring-2 ring-indigo-400/50 animate-pulse transition-all" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
