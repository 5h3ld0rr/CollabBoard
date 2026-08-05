import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  Sparkles,
  Star,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Navbar, AmbientBackground } from '../components/common';
import { WorkspaceStats } from '../components/dashboard/WorkspaceStats';
import { BoardCard } from '../components/dashboard/BoardCard';
import { CreateBoardModal } from '../components/dashboard/CreateBoardModal';
import { CreateWorkspaceModal, ManageWorkspaceModal } from '../components/workspace';
import { MOCK_BOARDS, MOCK_WORKSPACES } from '../data/mockData';
import type { Board, Workspace } from '../types';

export const Dashboard: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(MOCK_WORKSPACES[0]);
  const [boards, setBoards] = useState<Board[]>(MOCK_BOARDS);
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'tasks' | 'title'>('updated');
  
  // Modals state
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isManageWorkspaceModalOpen, setIsManageWorkspaceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Workspace actions
  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    setActiveTab(ws.id);
    showToast(`Switched to "${ws.name}"`);
  };

  const handleCreateWorkspace = (newWs: Workspace) => {
    setWorkspaces((prev) => [...prev, newWs]);
    setCurrentWorkspace(newWs);
    setActiveTab(newWs.id);
    showToast(`Created workspace "${newWs.name}"!`);
  };

  const handleUpdateWorkspace = (updatedWs: Workspace) => {
    setWorkspaces((prev) => prev.map((w) => (w.id === updatedWs.id ? updatedWs : w)));
    if (currentWorkspace.id === updatedWs.id) {
      setCurrentWorkspace(updatedWs);
    }
    // Also update board workspace names if renamed
    setBoards((prev) =>
      prev.map((b) =>
        b.workspaceId === updatedWs.id ? { ...b, workspaceName: updatedWs.name } : b
      )
    );
    showToast(`Updated workspace "${updatedWs.name}"`);
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (workspaces.length <= 1) {
      showToast("Cannot delete the only workspace");
      return;
    }
    const target = workspaces.find((w) => w.id === workspaceId);
    const remaining = workspaces.filter((w) => w.id !== workspaceId);
    setWorkspaces(remaining);
    setCurrentWorkspace(remaining[0]);
    setActiveTab('all');
    if (target) {
      showToast(`Deleted workspace "${target.name}"`);
    }
  };

  // Board actions
  const handleToggleFavorite = (boardId: string) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id === boardId) {
          const nextFav = !b.isFavorite;
          showToast(nextFav ? `Starred "${b.title}"` : `Removed "${b.title}" from favorites`);
          return { ...b, isFavorite: nextFav };
        }
        return b;
      })
    );
  };

  const handleDeleteBoard = (boardId: string) => {
    const target = boards.find((b) => b.id === boardId);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    if (target) {
      showToast(`Deleted board "${target.title}"`);
    }
  };

  const handleCreateBoard = (newBoard: Board) => {
    setBoards((prev) => [newBoard, ...prev]);
    // update workspace boardCount
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === newBoard.workspaceId ? { ...w, boardCount: w.boardCount + 1 } : w
      )
    );
    showToast(`Created board "${newBoard.title}"!`);
  };

  // Filter and Sort Logic
  const filteredBoards = useMemo(() => {
    return boards
      .filter((board) => {
        // Workspace / Tab filter
        if (activeTab === 'starred') {
          if (!board.isFavorite) return false;
        } else if (activeTab !== 'all') {
          if (board.workspaceId !== activeTab) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = board.title.toLowerCase().includes(q);
          const matchDesc = board.description.toLowerCase().includes(q);
          const matchWorkspace = board.workspaceName.toLowerCase().includes(q);
          const matchTags = board.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchWorkspace && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'tasks') {
          return b.stats.totalTasks - a.stats.totalTasks;
        }
        return 0;
      });
  }, [boards, activeTab, searchQuery, sortBy]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <AmbientBackground variant="minimal" />

      {/* Top Navbar with Workspace Switcher */}
      <Navbar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}
        onOpenManageWorkspace={() => setIsManageWorkspaceModalOpen(true)}
        onOpenCreateBoard={() => setIsCreateBoardModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentWorkspace.name} Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineering Sprint Boards
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {currentWorkspace.description}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 hover:shadow-indigo-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Board</span>
            </button>
          </div>
        </div>

        {/* Workspace Stat Metrics */}
        <WorkspaceStats boards={boards} />

        {/* Filter Tabs & Search / Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Boards ({boards.length})
            </button>

            <button
              onClick={() => setActiveTab('starred')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'starred'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400/80 text-amber-400" />
              <span>Starred ({boards.filter((b) => b.isFavorite).length})</span>
            </button>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveTab(ws.id);
                  setCurrentWorkspace(ws);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === ws.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {ws.name}
              </button>
            ))}
          </div>

          {/* Sort & Mobile Search Controls */}
          <div className="flex items-center space-x-3">
            <div className="md:hidden flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'tasks' | 'title')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-slate-700 transition"
              >
                <option value="updated">Recently Updated</option>
                <option value="tasks">Most Tasks</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Board Cards Grid */}
        {filteredBoards.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No boards found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No boards match your current search query or active filter. Try resetting the filter or create a new board.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Action Card: Create New Board */}
            <button
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="group rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/20 hover:bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px] transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 group-hover:bg-indigo-600/20 border border-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Create New Board
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Add a new sprint, feature roadmap, or team board
                </p>
              </div>
            </button>

            {/* Render Board Cards */}
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onToggleFavorite={handleToggleFavorite}
                onDeleteBoard={handleDeleteBoard}
              />
            ))}
          </div>
        )}

        {/* Live Activity & System Health Footer Bar */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Live Multiplayer Sync</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Connected to WebSocket engine. Real-time board broadcasts and cursor presence enabled.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">IndexedDB Local Cache</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                All boards synced locally. Offline mutations queue automatically on network loss.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Sprint Velocity</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                16 tasks completed across active boards in current sprint cycle.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        workspaces={workspaces}
        onCreateBoard={handleCreateBoard}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {/* Manage Workspace Modal */}
      <ManageWorkspaceModal
        isOpen={isManageWorkspaceModalOpen}
        onClose={() => setIsManageWorkspaceModalOpen(false)}
        workspace={currentWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />
    </div>
  );
};

export default Dashboard;
