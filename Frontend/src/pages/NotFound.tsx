import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Home as HomeIcon,
  Compass,
} from 'lucide-react';
import { AmbientBackground, Logo } from '../components/common';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <AmbientBackground variant="minimal" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-slate-900/80">
        <Logo />
      </header>

      {/* Central 404 Hero Container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 sm:px-6 py-16 text-center relative z-10">
        {/* Glow & 404 Large Display */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-linear-to-r from-indigo-500/20 via-violet-500/20 to-pink-500/20 rounded-full blur-3xl opacity-60 pointer-events-none" />
          <div className="relative inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-xl backdrop-blur-xl mb-4">
            <Compass className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Error 404 • Page Lost in Orbit</span>
          </div>
          <h1 className="text-7xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white via-slate-200 to-slate-600 select-none">
            404
          </h1>
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Houston, We Couldn't Find That Page
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          The link you followed may be broken, expired, or the board/page may have been moved to another workspace.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/60 hover:shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600 border-t border-slate-900/80">
        CollabBoard &copy; {new Date().getFullYear()} • Collaborative Engineering Workspace
      </footer>
    </div>
  );
};

export default NotFound;
