import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Wifi,
  WifiOff,
  LogOut,
  User,
  LayoutGrid,
} from "lucide-react";
import { Logo } from "./Logo";
import { WorkspaceSwitcher } from "../workspace/WorkspaceSwitcher";
import type { Workspace } from "../../types";

interface NavbarProps {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | string;
  onSelectWorkspace?: (workspace: Workspace) => void;
  onOpenCreateWorkspace?: () => void;
  onOpenManageWorkspace?: (workspace?: Workspace) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  variant?: "default" | "minimal" | "profile";
  hideWorkspace?: boolean;
  hideSearch?: boolean;
  hideLiveSync?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenManageWorkspace,
  searchQuery = "",
  onSearchChange,
  variant = "default",
  hideWorkspace = false,
  hideSearch = false,
  hideLiveSync = false,
}) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotificationToast(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showNotificationToast || showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationToast, showProfileMenu]);

  const isProfileVariant = variant === "profile";
  const shouldHideWorkspace = hideWorkspace || isProfileVariant;
  const shouldHideSearch = hideSearch || isProfileVariant;
  const shouldHideLiveSync = hideLiveSync || isProfileVariant;

  const handleSignOut = () => {
    navigate("/login");
  };

  const workspaceObject: Workspace =
    typeof currentWorkspace === "object" && currentWorkspace !== null
      ? currentWorkspace
      : {
          id: "ws-1",
          name:
            typeof currentWorkspace === "string"
              ? currentWorkspace
              : "Core Engineering",
          description: "Platform infrastructure and real-time engine",
          boardCount: 4,
          memberCount: 4,
          color: "from-indigo-600 to-violet-600",
          role: "Owner",
        };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo & Workspace Switcher */}
        <div className="flex items-center space-x-5 sm:space-x-6">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 shrink-0"
          >
            <Logo size="sm" />
          </Link>

          {!shouldHideWorkspace &&
            (workspaces &&
            onSelectWorkspace &&
            onOpenCreateWorkspace &&
            onOpenManageWorkspace ? (
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
            ))}
        </div>

        {/* Middle: Search Bar */}
        {!shouldHideSearch && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search boards, tasks, or tags..."
                className="w-full pl-10 pr-14 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 rounded border border-slate-700">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Network Status, Create CTA, Notifications, Profile */}
        <div className="flex items-center space-x-3">
          {/* Online / Offline Network Status Indicator Badge */}
          {!shouldHideLiveSync && (
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none transition-all ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/40 animate-pulse"
              }`}
              title={
                isOnline
                  ? "Network status: Online"
                  : "Network status: Offline (mutations cached locally)"
              }
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <WifiOff className="w-3.5 h-3.5" />
                </>
              )}
            </div>
          )}

          {/* Notifications Button */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotificationToast((prev) => !prev)}
              aria-label="Notifications"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
            </button>

            {showNotificationToast && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/90 backdrop-blur-xl z-50 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-bold text-white">
                    Notifications
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium">
                    1 New
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="text-slate-200 font-medium">
                      Clara moved card to In Progress
                    </p>
                    <span className="text-[10px] text-slate-400">
                      2 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-inner">
                AC
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/90 backdrop-blur-xl p-1.5 z-50 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-white">Alex Chen</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    alex.chen@collabboard.io
                  </p>
                </div>
                <div className="space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/profile");
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-left cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Your Profile</span>
                  </button>
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
