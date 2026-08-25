export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  color: string;
  role?: 'Owner' | 'Admin' | 'Member';
  boardRole?: 'Admin' | 'Editor' | 'Viewer';
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: User;
  content: string;
  createdAt: string;
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
  dueDate?: string;
  commentCount?: number;
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
  color?: string;
  role?: 'Owner' | 'Admin' | 'Member';
  members?: User[];
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  memberSince?: string;
}

export interface UserPreferences {
  emailTaskAssignment: boolean;
  emailWeeklyDigest: boolean;
  desktopNotifications: boolean;
  soundEffects: boolean;
  compactBoardView: boolean;
  offlineAutoSync: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  iconType: 'laptop' | 'smartphone';
}

export interface SubscriptionPlanItem {
  id: 'basic' | 'pro';
  name: string;
  tierLabel: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  annualTotal: number;
  description: string;
  isPopular?: boolean;
  badge?: string;
  features: string[];
}

export interface ColorOption {
  label: string;
  value: string;
}
