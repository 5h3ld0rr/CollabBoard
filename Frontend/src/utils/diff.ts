import type { Board, Task } from '../types';

/**
 * Checks whether a single board has meaningful changes between cached and server versions.
 */
export function hasBoardChanged(cached: Board | null | undefined, server: Board | null | undefined): boolean {
  if (!cached && !server) return false;
  if (!cached || !server) return true;
  if (cached.id !== server.id) return true;

  if (server.updatedAt && cached.updatedAt && server.updatedAt !== cached.updatedAt) {
    return true;
  }
  if (server.title !== cached.title || server.description !== cached.description) {
    return true;
  }
  if ((server.members?.length ?? 0) !== (cached.members?.length ?? 0)) {
    return true;
  }
  if ((server.tags?.length ?? 0) !== (cached.tags?.length ?? 0)) {
    return true;
  }
  if (server.isFavorite !== cached.isFavorite || server.color !== cached.color || server.icon !== cached.icon) {
    return true;
  }

  return false;
}

/**
 * Checks whether a list of boards has changed compared to cached boards.
 */
export function hasBoardsChanged(cached: Board[] | null | undefined, server: Board[] | null | undefined): boolean {
  if (!cached && !server) return false;
  if (!cached || !server) return true;
  if (cached.length !== server.length) return true;

  const cachedMap = new Map(cached.map((b) => [b.id, b]));

  for (const s of server) {
    const c = cachedMap.get(s.id);
    if (!c) return true;
    if (hasBoardChanged(c, s)) return true;
  }

  return false;
}

/**
 * Checks whether a single task has changed between cached and server versions.
 */
export function hasTaskChanged(cached: Task | null | undefined, server: Task | null | undefined): boolean {
  if (!cached && !server) return false;
  if (!cached || !server) return true;
  if (cached.id !== server.id) return true;

  // 1. Version / OCC comparison
  if (server.version !== undefined && cached.version !== undefined && server.version !== cached.version) {
    return true;
  }

  // 2. Timestamp comparison
  if (server.updatedAt && cached.updatedAt && server.updatedAt !== cached.updatedAt) {
    return true;
  }

  // 3. Status, priority, title, description, order
  if (
    server.status !== cached.status ||
    server.title !== cached.title ||
    server.priority !== cached.priority ||
    server.order !== cached.order ||
    (server.description || '') !== (cached.description || '')
  ) {
    return true;
  }

  // 4. Assignee comparison
  const cachedAssigneeId = typeof cached.assignee === 'object' ? cached.assignee?.id : cached.assignee;
  const serverAssigneeId = typeof server.assignee === 'object' ? server.assignee?.id : server.assignee;
  if (cachedAssigneeId !== serverAssigneeId) {
    return true;
  }

  // 5. Tags comparison
  const cTags = cached.tags || [];
  const sTags = server.tags || [];
  if (cTags.length !== sTags.length) return true;
  for (let i = 0; i < cTags.length; i++) {
    if (cTags[i] !== sTags[i]) return true;
  }

  // 6. Due date & comment count
  if (server.dueDate !== cached.dueDate || server.commentCount !== cached.commentCount) {
    return true;
  }

  return false;
}

/**
 * Checks whether a list of tasks has changed compared to cached tasks.
 */
export function hasTasksChanged(cached: Task[] | null | undefined, server: Task[] | null | undefined): boolean {
  if (!cached && !server) return false;
  if (!cached || !server) return true;
  if (cached.length !== server.length) return true;

  const cachedMap = new Map(cached.map((t) => [t.id, t]));

  for (const s of server) {
    const c = cachedMap.get(s.id);
    if (!c) return true;
    if (hasTaskChanged(c, s)) return true;
  }

  return false;
}
