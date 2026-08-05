export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  boardId: string;
  assignee?: User;
  tags: string[];
  order: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  color: string;
  icon: string;
  isFavorite: boolean;
  members: User[];
  tags: string[];
  stats: {
    totalTasks: number;
    todoCount: number;
    inProgressCount: number;
    doneCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  boardCount: number;
  memberCount: number;
}
