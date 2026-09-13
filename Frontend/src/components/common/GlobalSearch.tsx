import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  LayoutGrid,
  Kanban,
  CheckSquare,
  CornerDownLeft,
  Loader2,
  Circle,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { searchGlobal } from '../../api';
import type {
  GlobalSearchResults,
  GlobalSearchResultWorkspace,
  GlobalSearchResultBoard,
  GlobalSearchResultTask,
} from '../../types';

interface GlobalSearchProps {
  onSelectWorkspace?: (ws: GlobalSearchResultWorkspace) => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SearchCategory = 'all' | 'workspaces' | 'boards' | 'tasks';

type FlattenedItem =
  | { type: 'workspace'; data: GlobalSearchResultWorkspace }
  | { type: 'board'; data: GlobalSearchResultBoard }
  | { type: 'task'; data: GlobalSearchResultTask };

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSelectWorkspace,
  className = '',
  isOpen: controlledIsOpen,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const nextVal = typeof value === 'function' ? value(isOpen) : value;
      if (!isControlled) {
        setInternalIsOpen(nextVal);
      }
      onOpenChange?.(nextVal);
    },
    [isControlled, isOpen, onOpenChange]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const [results, setResults] = useState<GlobalSearchResults>({
    workspaces: [],
    boards: [],
    tasks: [],
    total: 0,
  });

  const modalInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  // Lock background body scroll when full-screen modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus modal search input on open
      setTimeout(() => {
        modalInputRef.current?.focus();
        modalInputRef.current?.select();
      }, 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults({ workspaces: [], boards: [], tasks: [], total: 0 });
      setSelectedIndex(-1);
      setActiveTab('all');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ workspaces: [], boards: [], tasks: [], total: 0 });
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await searchGlobal(trimmed, { signal: controller.signal });
        setResults(data);
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Flattened items for keyboard navigation based on active category
  const flattenedItems = useMemo<FlattenedItem[]>(() => {
    const list: FlattenedItem[] = [];

    if (activeTab === 'all' || activeTab === 'workspaces') {
      results.workspaces.forEach((w) => list.push({ type: 'workspace', data: w }));
    }
    if (activeTab === 'all' || activeTab === 'boards') {
      results.boards.forEach((b) => list.push({ type: 'board', data: b }));
    }
    if (activeTab === 'all' || activeTab === 'tasks') {
      results.tasks.forEach((t) => list.push({ type: 'task', data: t }));
    }

    return list;
  }, [results, activeTab]);

  // Scroll active item into view when navigating via arrow keys
  useEffect(() => {
    if (selectedIndex >= 0 && resultsListRef.current) {
      const activeEl = resultsListRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Selection handler
  const handleSelectItem = (item: FlattenedItem) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);

    if (item.type === 'workspace') {
      onSelectWorkspace?.(item.data);
      navigate(`/workspaces/${item.data.id}`);
    } else if (item.type === 'board') {
      navigate(`/boards/${item.data.id}`);
    } else if (item.type === 'task') {
      navigate(`/tasks/${item.data.id}`);
    }
  };

  // Keyboard navigation within the modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flattenedItems.length === 0) return;
      setSelectedIndex((prev) =>
        prev < flattenedItems.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flattenedItems.length === 0) return;
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : flattenedItems.length - 1
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedItems.length) {
        handleSelectItem(flattenedItems[selectedIndex]);
      } else if (flattenedItems.length > 0) {
        handleSelectItem(flattenedItems[0]);
      }
    }
  };

  const renderTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            Done
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Circle className="w-2 h-2 mr-0.5" />
            Todo
          </span>
        );
    }
  };

  const isQueryActive = query.trim().length > 0;
  const hasMatches = results.total > 0;
  let currentRenderIndex = 0;

  return (
    <div className={`relative w-full ${className}`}>
      {/* 1. Trigger Search Bar in Navbar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="relative w-full flex items-center cursor-pointer group focus:outline-none"
      >
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
        </div>

        <div className="w-full pl-10 pr-16 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700 transition-all shadow-inner select-none flex items-center">
          <span>Search workspaces, boards, tasks...</span>
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center space-x-0.5 pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800/90 rounded border border-slate-700 shadow-xs flex items-center gap-0.5">
            Ctrl + K
          </kbd>
        </div>
      </div>

      {/* 2. Full-Screen Modal Overlay ("pop whole screen") */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
            aria-label="Close search overlay"
          />

          {/* Centered Command Palette Card */}
          <div
            ref={modalContainerRef}
            className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/50 ring-1 ring-slate-800/80 flex flex-col max-h-[82vh] overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Input Header */}
            <div className="relative flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950/60">
              <div className="mr-3 flex items-center pointer-events-none">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-indigo-400" />
                )}
              </div>

              <input
                ref={modalInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search across all workspaces, boards, tasks, tags..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
              />

              <div className="flex items-center space-x-2 shrink-0 ml-2">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResults({ workspaces: [], boards: [], tasks: [], total: 0 });
                      setSelectedIndex(-1);
                      modalInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Clear query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition cursor-pointer flex items-center space-x-1"
                  title="Close search (Esc)"
                >
                  <span>Esc</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs Bar (Visible when query exists) */}
            {isQueryActive && (
              <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-1.5 overflow-x-auto text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  All ({results.total})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('workspaces')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'workspaces'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Workspaces ({results.workspaces.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('boards')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'boards'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Boards ({results.boards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Tasks ({results.tasks.length})
                </button>
              </div>
            )}

            {/* Results Scroll Area */}
            <div
              ref={resultsListRef}
              className="flex-1 overflow-y-auto divide-y divide-slate-800/50"
            >
              {/* Searching Skeleton */}
              {isLoading && results.total === 0 && (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-medium">
                    Searching across all workspaces, boards, and tasks...
                  </span>
                </div>
              )}

              {/* Empty State when no results found */}
              {!isLoading && isQueryActive && !hasMatches && (
                <div className="p-10 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-11 h-11 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-1">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300">
                    No results found for &ldquo;{query}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    No matching workspaces, boards, or tasks found. Try searching with a broader keyword or tag.
                  </p>
                </div>
              )}

              {/* Initial State when query is empty */}
              {!isQueryActive && (
                <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Global Workspace &amp; Board Search
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Type anything to search across all your workspaces, boards, and sprint tasks.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Workspaces Section */}
              {(activeTab === 'all' || activeTab === 'workspaces') &&
                results.workspaces.length > 0 && (
                  <div className="p-3">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Workspaces</span>
                      <span className="text-slate-500 font-normal">
                        ({results.workspaces.length})
                      </span>
                    </div>

                    <div className="mt-1 space-y-1">
                      {results.workspaces.map((ws) => {
                        const itemIndex = currentRenderIndex++;
                        const isHighlighted = selectedIndex === itemIndex;

                        return (
                          <div
                            key={ws.id}
                            data-result-index={itemIndex}
                            onClick={() =>
                              handleSelectItem({ type: 'workspace', data: ws })
                            }
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                              isHighlighted
                                ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-xs'
                                : 'hover:bg-slate-800/60 text-slate-200 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
                                <LayoutGrid className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                                  {ws.name}
                                </div>
                                {ws.description && (
                                  <div className="text-xs text-slate-400 truncate">
                                    {ws.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 ml-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                {ws.boardCount || 0}{' '}
                                {ws.boardCount === 1 ? 'board' : 'boards'}
                              </span>
                              <CornerDownLeft
                                className={`w-3.5 h-3.5 text-slate-400 transition-opacity ${
                                  isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 2. Boards Section */}
              {(activeTab === 'all' || activeTab === 'boards') &&
                results.boards.length > 0 && (
                  <div className="p-3">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <Kanban className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Boards</span>
                      <span className="text-slate-500 font-normal">
                        ({results.boards.length})
                      </span>
                    </div>

                    <div className="mt-1 space-y-1">
                      {results.boards.map((b) => {
                        const itemIndex = currentRenderIndex++;
                        const isHighlighted = selectedIndex === itemIndex;

                        return (
                          <div
                            key={b.id}
                            data-result-index={itemIndex}
                            onClick={() =>
                              handleSelectItem({ type: 'board', data: b })
                            }
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                              isHighlighted
                                ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-xs'
                                : 'hover:bg-slate-800/60 text-slate-200 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
                                <Kanban className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="flex items-center space-x-2 truncate">
                                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                                    {b.title}
                                  </span>
                                  {b.workspaceName && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/90 text-slate-400 border border-slate-700/80 shrink-0">
                                      {b.workspaceName}
                                    </span>
                                  )}
                                </div>
                                {b.description ? (
                                  <div className="text-xs text-slate-400 truncate">
                                    {b.description}
                                  </div>
                                ) : (
                                  Array.isArray(b.tags) &&
                                  b.tags.length > 0 && (
                                    <div className="flex items-center space-x-1.5 mt-0.5 truncate">
                                      {b.tags.slice(0, 3).map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="text-[11px] text-slate-400"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 ml-3">
                              <span className="text-xs text-slate-400">
                                {b.stats?.totalTasks || 0} tasks
                              </span>
                              <CornerDownLeft
                                className={`w-3.5 h-3.5 text-slate-400 transition-opacity ${
                                  isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 3. Tasks Section */}
              {(activeTab === 'all' || activeTab === 'tasks') &&
                results.tasks.length > 0 && (
                  <div className="p-3">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tasks</span>
                      <span className="text-slate-500 font-normal">
                        ({results.tasks.length})
                      </span>
                    </div>

                    <div className="mt-1 space-y-1">
                      {results.tasks.map((t) => {
                        const itemIndex = currentRenderIndex++;
                        const isHighlighted = selectedIndex === itemIndex;

                        return (
                          <div
                            key={t.id}
                            data-result-index={itemIndex}
                            onClick={() =>
                              handleSelectItem({ type: 'task', data: t })
                            }
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                              isHighlighted
                                ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-xs'
                                : 'hover:bg-slate-800/60 text-slate-200 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                <CheckSquare className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="flex items-center space-x-2 truncate">
                                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                                    {t.title}
                                  </span>
                                  {t.boardTitle && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/80 shrink-0">
                                      {t.boardTitle}
                                    </span>
                                  )}
                                </div>
                                {t.description && (
                                  <div className="text-xs text-slate-400 truncate">
                                    {t.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 ml-3">
                              {renderTaskStatusBadge(t.status)}
                              <CornerDownLeft
                                className={`w-3.5 h-3.5 text-slate-400 transition-opacity ${
                                  isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer: Shortcuts Guide */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0 select-none">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>
              <div className="text-slate-400 text-xs font-medium flex items-center space-x-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                  Ctrl + K
                </kbd>
                <span>Global Search</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
