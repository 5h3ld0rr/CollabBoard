import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import type { Workspace } from '../../types';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSelectWorkspace: (workspace: Workspace) => void;
  onOpenCreateWorkspace: () => void;
  onOpenManageWorkspace: (workspace?: Workspace) => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenManageWorkspace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Pill Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition shadow-sm active:scale-98 cursor-pointer"
      >
        <div
          className={`w-3.5 h-3.5 rounded bg-linear-to-br ${
            currentWorkspace.color || 'from-indigo-600 to-violet-600'
          } flex items-center justify-center`}
        >
          <LayoutGrid className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="font-semibold truncate max-w-30 sm:max-w-40">
          {currentWorkspace.name}
        </span>
        {currentWorkspace.role && (
          <span className="hidden lg:inline px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {currentWorkspace.role}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/90 backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10">
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Workspaces
          </div>

          {/* Workspace List */}
          <div className="space-y-1 my-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace.id;
              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer group/item ${
                    isSelected
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-white font-semibold'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 pr-2">
                    <div
                      className={`w-6 h-6 rounded-lg bg-linear-to-br ${
                        ws.color || 'from-indigo-600 to-violet-600'
                      } flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <LayoutGrid className="w-3 h-3 text-white" />
                    </div>
                    <div className="truncate min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <p className="truncate font-medium">{ws.name}</p>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-normal">
                        <span>{ws.boardCount} boards</span>
                        <span>•</span>
                        <span className="flex items-center space-x-0.5">
                          <Users className="w-2.5 h-2.5" />
                          <span>{ws.memberCount} members</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Settings Icon inside Workspace Item */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onOpenManageWorkspace(ws);
                    }}
                    title={`Workspace settings for ${ws.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition shrink-0 opacity-70 group-hover/item:opacity-100 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-1 border-t border-slate-800/80">
            {/* Create Workspace Action */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateWorkspace();
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-indigo-400 hover:bg-indigo-600/10 hover:text-indigo-300 transition text-left font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
