import React from 'react';
import { AmbientBackground } from '../common/AmbientBackground';

/**
 * Modern glassmorphic skeleton loader representing the workspace dashboard.
 * Displayed during initial workspace resolution or route navigation.
 */
export const WorkspaceSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <AmbientBackground variant="minimal" />

      {/* Top Navbar Skeleton */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 animate-pulse">
          {/* Brand + Workspace Switcher Skeleton */}
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30" />
              <div className="w-24 h-5 rounded-md bg-slate-800" />
            </div>
            <div className="w-36 sm:w-44 h-8 rounded-xl bg-slate-900 border border-slate-800" />
          </div>

          {/* Search bar skeleton */}
          <div className="hidden md:block flex-1 max-w-md">
            <div className="w-full h-9 rounded-xl bg-slate-900 border border-slate-800" />
          </div>

          {/* User profile actions */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800" />
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
          </div>
        </div>
      </header>

      {/* Main Skeleton Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header Title Section Skeleton */}
        <div className="mb-8 space-y-3">
          <div className="w-32 h-4 rounded-md bg-indigo-500/20" />
          <div className="w-64 sm:w-96 h-9 rounded-xl bg-slate-800" />
          <div className="w-80 sm:w-1/2 h-4 rounded-md bg-slate-800/60" />
        </div>

        {/* 4 Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex items-start justify-between"
            >
              <div className="space-y-2 flex-1">
                <div className="w-24 h-3.5 rounded bg-slate-800" />
                <div className="w-16 h-7 rounded-lg bg-slate-800" />
                <div className="w-28 h-3 rounded bg-slate-800/60" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0" />
            </div>
          ))}
        </div>

        {/* Filter Tabs & Search / Sort Controls Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-28 h-8 rounded-xl bg-slate-800" />
            <div className="w-24 h-8 rounded-xl bg-slate-900 border border-slate-800" />
          </div>
          <div className="w-40 h-8 rounded-xl bg-slate-900 border border-slate-800" />
        </div>

        {/* Board Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="w-16 h-5 rounded-full bg-slate-800/70" />
                </div>
                <div className="w-3/4 h-5 rounded bg-slate-800" />
                <div className="w-full h-3.5 rounded bg-slate-800/50" />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/50">
                <div className="w-full h-2 rounded-full bg-slate-800" />
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900" />
                  </div>
                  <div className="w-20 h-3 rounded bg-slate-800/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceSkeleton;
