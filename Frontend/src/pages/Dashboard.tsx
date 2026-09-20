import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  ArrowUpDown,
  Sparkles,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Navbar, AmbientBackground } from "../components/common";
import { WorkspaceStats } from "../components/dashboard/WorkspaceStats";
import { BoardCard } from "../components/dashboard/BoardCard";
import { CreateBoardModal } from "../components/dashboard/CreateBoardModal";
import {
  CreateWorkspaceModal,
  ManageWorkspaceModal,
  WorkspaceSkeleton,
} from "../components/workspace";
import { useBoard, useAuth } from "../context";
import {
  getWorkspaces,
  createWorkspace as apiCreateWorkspace,
  updateWorkspace as apiUpdateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
} from "../api";
import { PLAN_LIMITS } from "../constants";
import type { Board, Workspace } from "../types";

export const Dashboard: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const preloadedWorkspaces = (location.state as any)?.workspaces as Workspace[] | undefined;

  const {
    state: { boards },
    addBoard,
    toggleFavoriteBoard,
  } = useBoard();
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'pro';

  const [workspaces, setWorkspaces] = useState<Workspace[]>(preloadedWorkspaces || []);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(!preloadedWorkspaces || preloadedWorkspaces.length === 0);
  const [managingWorkspace, setManagingWorkspace] = useState<Workspace | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"all" | "starred">("all");
  const [sortBy, setSortBy] = useState<"updated" | "tasks" | "title">("updated");

  // Modals state
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] =
    useState(false);
  const [isManageWorkspaceModalOpen, setIsManageWorkspaceModalOpen] =
    useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Derive active workspace directly from state
  const currentWorkspace = useMemo(() => {
    if (workspaces.length === 0) return null;
    return workspaceId
      ? workspaces.find((w) => w.id === workspaceId) ?? null
      : workspaces[0];
  }, [workspaces, workspaceId]);

  // Load workspaces once on mount (skips if preloaded from WorkspaceRedirect)
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (preloadedWorkspaces && preloadedWorkspaces.length > 0) {
        return;
      }
      try {
        const list = await getWorkspaces();
        if (isMounted) {
          setWorkspaces(list);
        }
      } catch (err) {
        console.warn("Failed to load workspaces:", err);
      } finally {
        if (isMounted) {
          setIsLoadingWorkspaces(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [preloadedWorkspaces]);

  // If workspaceId in the URL is invalid/not found, navigate to the correct primary workspace
  useEffect(() => {
    if (workspaces.length > 0 && workspaceId) {
      const isValid = workspaces.some((w) => w.id === workspaceId);
      if (!isValid && workspaces[0]?.id) {
        navigate(`/workspaces/${workspaces[0].id}`, { replace: true });
      }
    }
  }, [workspaces, workspaceId, navigate]);

  // Workspace actions
  const handleSelectWorkspace = (ws: Workspace) => {
    navigate(`/workspaces/${ws.id}`);
    showToast(`Switched to "${ws.name}"`);
  };

  const handleCreateWorkspace = async (
    newWsData: Partial<Workspace> & { name: string }
  ) => {
    if (!isPro && workspaces.length >= PLAN_LIMITS.basic.maxWorkspaces) {
      showToast(`Workspace limit reached (${workspaces.length}/${PLAN_LIMITS.basic.maxWorkspaces}). Upgrade to Pro for unlimited workspaces.`);
      return;
    }
    const created = await apiCreateWorkspace(newWsData);
    setWorkspaces((prev) => [...prev, created]);
    navigate(`/workspaces/${created.id}`);
    showToast(`Created workspace "${created.name}"!`);
  };

  const handleUpdateWorkspace = async (updatedWs: Workspace) => {
    try {
      const updated = await apiUpdateWorkspace(updatedWs.id, updatedWs);
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w))
      );
      showToast(`Updated workspace "${updated.name}"`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update workspace";
      showToast(message);
      throw err;
    }
  };

  const handleDeleteWorkspace = async (deletedWorkspaceId: string) => {
    if (workspaces.length <= 1) {
      showToast("Cannot delete the only workspace");
      return;
    }
    try {
      await apiDeleteWorkspace(deletedWorkspaceId);
      const remaining = workspaces.filter((w) => w.id !== deletedWorkspaceId);
      setWorkspaces(remaining);
      if (remaining.length > 0) {
        navigate(`/workspaces/${remaining[0].id}`);
      }
      setActiveTab("all");
      showToast("Workspace deleted");
    } catch {
      showToast("Failed to delete workspace");
    }
  };

  // Board actions
  const handleToggleFavorite = (boardId: string) => {
    toggleFavoriteBoard(boardId);
    showToast("Toggled board favorite status");
  };

  const handleCreateBoard = async (newBoard: Board) => {
    const targetWs = workspaces.find((w) => w.id === newBoard.workspaceId) || currentWorkspace;
    const currentCount = targetWs?.boardCount ?? currentWorkspaceBoards.length;
    if (!isPro && currentCount >= PLAN_LIMITS.basic.maxBoardsPerWorkspace) {
      showToast(`Board limit reached for this workspace (${currentCount}/${PLAN_LIMITS.basic.maxBoardsPerWorkspace}). Upgrade to Pro for unlimited boards.`);
      return;
    }
    await addBoard(newBoard);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === newBoard.workspaceId
          ? { ...w, boardCount: (w.boardCount || 0) + 1 }
          : w
      )
    );
    showToast(`Created board "${newBoard.title}"!`);
  };

  // Boards belonging to the currently active workspace
  const currentWorkspaceBoards = useMemo(() => {
    if (!currentWorkspace) return boards;
    const wsId = String(currentWorkspace.id);
    const wsName = currentWorkspace.name.toLowerCase();

    return boards.filter((board) => {
      if (board.workspaceId) return String(board.workspaceId) === wsId;
      if (board.workspaceName)
        return board.workspaceName.toLowerCase() === wsName;
      return true;
    });
  }, [boards, currentWorkspace]);

  const starredBoardsCount = useMemo(
    () => currentWorkspaceBoards.filter((b) => b.isFavorite).length,
    [currentWorkspaceBoards]
  );

  // Filter and Sort Logic
  const filteredBoards = useMemo(() => {
    return currentWorkspaceBoards
      .filter((board) => {
        if (activeTab === "starred" && !board.isFavorite) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "tasks") {
          return (b.stats?.totalTasks || 0) - (a.stats?.totalTasks || 0);
        }
        if (sortBy === "updated") {
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          return timeB - timeA;
        }
        return 0;
      });
  }, [currentWorkspaceBoards, activeTab, sortBy]);

  // Display skeleton loader while initial data loads or while redirecting from an invalid workspace ID
  if (isLoadingWorkspaces || (workspaces.length > 0 && !currentWorkspace)) {
    return <WorkspaceSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <AmbientBackground variant="minimal" />

      {/* Top Navbar with Workspace Switcher */}
      <Navbar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace || undefined}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}
        onOpenManageWorkspace={(ws) => {
          setManagingWorkspace(ws ?? currentWorkspace);
          setIsManageWorkspaceModalOpen(true);
        }}
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
        <div className="mb-8">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentWorkspace?.name || "Workspace"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineering Sprint Boards
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {currentWorkspace?.description ||
                "Team workspaces, sprint roadmaps, and collaborative project boards"}
            </p>
          </div>
        </div>

        {/* Workspace Stat Metrics */}
        <WorkspaceStats
          boards={currentWorkspaceBoards}
          workspaceCount={workspaces.length}
          workspaceName={currentWorkspace?.name}
        />

        {/* Filter Tabs & Search / Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              All Boards ({currentWorkspaceBoards.length})
            </button>

            <button
              onClick={() => setActiveTab("starred")}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "starred"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400/80 text-amber-400" />
              <span>Starred ({starredBoardsCount})</span>
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "updated" | "tasks" | "title")
              }
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-slate-700 transition cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="tasks">Most Tasks</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Board Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Action Card: Create New Board */}
          <button
            onClick={() => setIsCreateBoardModalOpen(true)}
            className="group rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/20 hover:bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-65 transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 group-hover:bg-indigo-600/20 border border-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Create New Board
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-50">
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
            />
          ))}
        </div>
      </main>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspace?.id}
        onCreateBoard={handleCreateBoard}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
        currentWorkspaceCount={workspaces.length}
      />

      {/* Manage Workspace Modal */}
      <ManageWorkspaceModal
        isOpen={isManageWorkspaceModalOpen}
        onClose={() => setIsManageWorkspaceModalOpen(false)}
        workspace={managingWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />
    </div>
  );
};

export default Dashboard;
