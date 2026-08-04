import React from "react";
import { Link } from "react-router-dom";
import {
  Kanban,
  Zap,
  WifiOff,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  RefreshCw,
  Plus,
  MoreHorizontal,
  CircleDot,
} from "lucide-react";
import { AmbientBackground, Button, Logo } from "../components/common";

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      <AmbientBackground variant="default" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/70 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#preview" className="hover:text-white transition-colors duration-150">
              Preview
            </a>
            <a href="#features" className="hover:text-white transition-colors duration-150">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors duration-150">
              Architecture
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-150"
            >
              Sign In
            </Link>
            <Button
              to="/register"
              size="sm"
              variant="primary"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 backdrop-blur-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Multiplayer Kanban</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight sm:leading-none">
          Manage tasks with <br className="hidden sm:inline" />
          <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            instant sync
          </span>{" "}
          & offline freedom.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl leading-relaxed">
          CollabBoard gives your team a high-performance visual workspace. Live
          multiplayer updates via WebSockets, automatic offline persistence, and
          crystal-clear sprint coordination.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center">
          <Button
            to="/register"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto"
            iconRight={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          >
            Create Free Workspace
          </Button>
          <Button
            to="/login"
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Sign In to Existing Board
          </Button>
        </div>

        {/* Metrics Strip */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 border-y border-slate-800/80 py-6 w-full max-w-4xl">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              &lt; 50ms
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Sync Latency
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              100%
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Offline Capable
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              Zero
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Sync Conflicts
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              E2E
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Data Security
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Board Preview Section */}
      <section id="preview" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Interactive Product Preview
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Built for modern engineering & design teams
          </p>
        </div>

        {/* Mock Kanban Window */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-indigo-950/40 overflow-hidden ring-1 ring-white/10 backdrop-blur-xl">
          {/* Mock Board Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Kanban className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white text-sm sm:text-base">
                    🚀 Sprint 1: Real-time Core
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                    <CircleDot className="w-2.5 h-2.5 animate-pulse" />
                    <span>Live Sync Connected</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  CollabBoard Team Workspace • 3 members active
                </p>
              </div>
            </div>

            {/* Active User Avatars */}
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 ring-2 ring-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">
                  CT
                </div>
                <div className="w-7 h-7 rounded-full bg-violet-600 ring-2 ring-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">
                  AL
                </div>
                <div className="w-7 h-7 rounded-full bg-pink-600 ring-2 ring-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">
                  EK
                </div>
              </div>
              <button className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1">
                <Plus className="w-3 h-3" />
                <span>Invite</span>
              </button>
            </div>
          </div>

          {/* Kanban Columns Grid */}
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/30">
            {/* Column: To Do */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                    To Do
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                    2
                  </span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
              </div>

              {/* Card 1 */}
              <div className="rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 p-3.5 shadow-sm space-y-2.5 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    High Priority
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">CB-104</span>
                </div>
                <p className="text-sm font-medium text-slate-200 leading-snug">
                  Implement WebSocket Heartbeat & Reconnection Backoff
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <span>Backend</span>
                  <div className="w-5 h-5 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[9px]">
                    AL
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 p-3.5 shadow-sm space-y-2.5 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Frontend
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">CB-107</span>
                </div>
                <p className="text-sm font-medium text-slate-200 leading-snug">
                  Add Board Export & JSON Backup Feature
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <span>UX</span>
                  <div className="w-5 h-5 rounded-full bg-violet-700 text-white flex items-center justify-center text-[9px]">
                    CT
                  </div>
                </div>
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-indigo-300">
                    In Progress
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-400 font-mono border border-indigo-800/50">
                    1
                  </span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
              </div>

              {/* Card 3 - Active */}
              <div className="rounded-lg bg-slate-800/90 border border-indigo-500/40 p-3.5 shadow-lg shadow-indigo-950/50 space-y-2.5 ring-1 ring-indigo-500/20">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Multiplayer
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono flex items-center space-x-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                </div>
                <p className="text-sm font-medium text-white leading-snug">
                  Real-time Cursor Presence & Live Card Drag Broadcasting
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <span className="text-indigo-400">Editing now</span>
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[9px] ring-1 ring-slate-800">
                      EK
                    </div>
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] ring-1 ring-slate-800">
                      CT
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column: Done */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                    Completed
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-mono border border-emerald-800/50">
                    2
                  </span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
              </div>

              {/* Card 4 */}
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3.5 space-y-2.5 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Done</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">CB-101</span>
                </div>
                <p className="text-sm font-medium text-slate-300 line-through">
                  User Authentication & Secure JWT Session Handlers
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <span>Security</span>
                  <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px]">
                    AL
                  </div>
                </div>
              </div>

              {/* Card 5 */}
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3.5 space-y-2.5 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Done</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">CB-102</span>
                </div>
                <p className="text-sm font-medium text-slate-300 line-through">
                  IndexedDB Local Cache Storage Pipeline
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <span>Storage</span>
                  <div className="w-5 h-5 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[9px]">
                    CT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Engineered for Resilience
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Everything your team needs to stay aligned
          </p>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Designed from the ground up for speed, offline robustness, and zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Multiplayer Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every card drag, title update, and comment is immediately broadcast to all
              connected collaborators via persistent WebSockets.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Offline-First Architecture</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Keep working on trains, planes, or unstable connections. Your edits are
              cached locally and resolved gracefully upon reconnection.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Team Workspaces</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Group related projects into dedicated team spaces with customizable member
              roles, permissions, and board-level privacy.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Intuitive Drag & Drop</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fluid, 60fps micro-interactions with tactile feedback. Reorder columns,
              move tasks, and batch edit with keyboard shortcuts.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Secure by Default</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Protected by industry standard encryption, strict CORS, CSP security
              headers, and robust token-based access control.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Modern Aesthetic</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tailored dark mode interface that reduces eye strain, built with Tailwind
              CSS v4 tokens and polished micro-animations.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture / Why Us Section */}
      <section id="architecture" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/60 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            System Architecture
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Why teams rely on CollabBoard
          </p>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Engineered from the ground up for high concurrency, zero data loss, and uninterrupted offline productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Architecture Pillar 1 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/90 p-6 sm:p-8 space-y-4 hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-950/20">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Event-Driven Sync Engine</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bi-directional WebSocket streaming with sub-50ms propagation. Real-time presence indicators, live cursor tracks, and state differential broadcasts keep distributed squads aligned in lockstep.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub-50ms latency WebSocket pipelines</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multiplayer cursor & active card locking</span>
              </li>
            </ul>
          </div>

          {/* Architecture Pillar 2 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/90 p-6 sm:p-8 space-y-4 hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-950/20">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Local-First Storage Layer</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Robust client-side cache powered by IndexedDB. Make edits offline without anxiety — mutations queue automatically and reconcile seamlessly via optimistic merging when network reconnects.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero downtime with IndexedDB cache</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic conflict resolution</span>
              </li>
            </ul>
          </div>

          {/* Architecture Pillar 3 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/90 p-6 sm:p-8 space-y-4 hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-950/20">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Zero-Trust Security Foundation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enterprise-grade safety at every tier. Short-lived JWT session tokens, hardened CORS/CSP headers, granular workspace RBAC policies, and audited database persistence.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Role-based workspace access controls</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>End-to-end encrypted session transport</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-linear-to-b from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to experience frictionless collaboration?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed">
            Create your account in seconds and start organizing tasks with your team today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              to="/register"
              size="lg"
              variant="primary"
              className="w-full sm:w-auto"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Get Started Now
            </Button>
            <Button
              to="/login"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Kanban className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">CollabBoard</span>
            <span className="hidden sm:inline">— Real-time Collaborative Visual Workspace</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="hover:text-slate-200 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-200 transition-colors">
              Register
            </Link>
            <span>© {new Date().getFullYear()} CollabBoard</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;


