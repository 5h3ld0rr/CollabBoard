import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  Wifi,
  WifiOff,
  LogOut,
  User,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { Logo } from './Logo';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import type { Workspace } from '../../types';

interface NavbarProps {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | string;
  onSelectWorkspace?: (workspace: Workspace) => void;
  onOpenCreateWorkspace?: () => void;
  onOpenManageWorkspace?: () => void;
  onOpenCreateBoard?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenManageWorkspace,
  onOpenCreateBoard,
  searchQuery = '',
  onSearchChange,
}) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const toggleNetworkStatus = () => {
    setIsOnline((prev) => !prev);
  };

  const handleSignOut = () => {
    navigate('/login');
  };

  const workspaceObject: Workspace =
    typeof currentWorkspace === 'object' && currentWorkspace !== null
      ? currentWorkspace
      : {
          id: 'ws-1',
          name: typeof currentWorkspace === 'string' ? currentWorkspace : 'Core Engineering',
          description: 'Platform infrastructure and real-time engine',
          boardCount: 4,
          memberCount: 4,
          color: 'from-indigo-600 to-violet-600',
          role: 'Owner',
        };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo & Workspace Switcher */}
        <div className="flex items-center space-x-5 sm:space-x-6">
          <Link to="/boards" className="flex items-center space-x-2 shrink-0">
            <Logo size="sm" />
          </Link>

          {workspaces && onSelectWorkspace && onOpenCreateWorkspace && onOpenManageWorkspace ? (
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspace={workspaceObject}
              onSelectWorkspace={onSelectWorkspace}
              onOpenCreateWorkspace={onOpenCreateWorkspace}
              onOpenManageWorkspace={onOpenManageWorkspace}
            />
          ) : (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold">{workspaceObject.name}</span>
            </div>
          )}
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search boards, tasks, or tags... (Press /)"
              className="w-full pl-10 pr-10 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 rounded border border-slate-700">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Side: Network Status, Create CTA, Notifications, Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Offline/Online Simulator Pill */}
          <button
            onClick={toggleNetworkStatus}
            title={isOnline ? "Simulated Online (Click to toggle offline mode)" : "Simulated Offline"}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20"
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span>Live Sync</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Mode</span>
              </>
            )}
          </button>

          {/* New Board Action Button */}
          {onOpenCreateBoard && (
            <button
              onClick={onOpenCreateBoard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-950/50 hover:shadow-indigo-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Board</span>
            </button>
          )}

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationToast((prev) => !prev)}
              aria-label="Notifications"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
            </button>

            {showNotificationToast && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-indigo-400 font-medium">1 New</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="text-slate-200 font-medium">Clara moved card to In Progress</p>
                    <span className="text-[10px] text-slate-400">2 minutes ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-inner">
                AC
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-white">Alex Chen</p>
                  <p className="text-[11px] text-slate-400 truncate">alex.chen@collabboard.io</p>
                </div>
                <div className="space-y-0.5 text-xs">
                  <button className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-left">
                    <User className="w-3.5 h-3.5" />
                    <span>Your Profile</span>
                  </button>
                  {onOpenManageWorkspace && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenManageWorkspace();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Workspace Settings</span>
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
