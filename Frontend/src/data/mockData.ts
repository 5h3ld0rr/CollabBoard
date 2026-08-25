import type { Board, Task, TaskComment, User, Workspace } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Alex Chen',
    email: 'alex.chen@collabboard.io',
    initials: 'AC',
    color: 'bg-indigo-600',
  },
  {
    id: 'usr-2',
    name: 'Clara Tanaka',
    email: 'clara.t@collabboard.io',
    initials: 'CT',
    color: 'bg-violet-600',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.r@collabboard.io',
    initials: 'ER',
    color: 'bg-pink-600',
  },
  {
    id: 'usr-4',
    name: 'Marcus Vance',
    email: 'marcus.v@collabboard.io',
    initials: 'MV',
    color: 'bg-emerald-600',
  },
];

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Core Engineering',
    description: 'Platform infrastructure, real-time sync engine, and API services',
    boardCount: 4,
    memberCount: 4,
    color: 'from-indigo-600 to-violet-600',
    role: 'Owner',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[3]],
  },
  {
    id: 'ws-2',
    name: 'Product & Design',
    description: 'UX research, design systems, and user interaction flows',
    boardCount: 2,
    memberCount: 2,
    color: 'from-fuchsia-600 to-pink-600',
    role: 'Admin',
    members: [MOCK_USERS[0], MOCK_USERS[1]],
  },
  {
    id: 'ws-3',
    name: 'Marketing & Growth',
    description: 'Product launches, marketing campaigns, and user acquisition',
    boardCount: 1,
    memberCount: 2,
    color: 'from-amber-600 to-orange-600',
    role: 'Member',
    members: [MOCK_USERS[0], MOCK_USERS[2]],
  },
];

export const MOCK_BOARDS: Board[] = [
  {
    id: 'board-1',
    title: 'Sprint 1: Real-time Core',
    description: 'WebSocket pipelines, live cursor broadcasting, and optimistic locking engine',
    workspaceId: 'ws-1',
    workspaceName: 'Core Engineering',
    color: 'from-indigo-600 to-violet-600',
    icon: 'Kanban',
    isFavorite: true,
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]],
    tags: ['Backend', 'WebSocket', 'Priority'],
    stats: {
      totalTasks: 5,
      todoCount: 2,
      inProgressCount: 2,
      doneCount: 1,
    },
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '10 mins ago',
  },
  {
    id: 'board-2',
    title: 'Client Offline-First Pipeline',
    description: 'IndexedDB caching layer, sync mutation queues, and offline conflict modals',
    workspaceId: 'ws-1',
    workspaceName: 'Core Engineering',
    color: 'from-emerald-600 to-teal-600',
    icon: 'WifiOff',
    isFavorite: true,
    members: [MOCK_USERS[0], MOCK_USERS[3]],
    tags: ['Storage', 'IndexedDB', 'Client'],
    stats: {
      totalTasks: 4,
      todoCount: 1,
      inProgressCount: 1,
      doneCount: 2,
    },
    createdAt: '2026-08-12T14:30:00Z',
    updatedAt: '45 mins ago',
  },
  {
    id: 'board-3',
    title: 'Design System & Component Kit',
    description: 'Refactoring shared tokens, accessibility audits, and micro-interaction states',
    workspaceId: 'ws-2',
    workspaceName: 'Product & Design',
    color: 'from-fuchsia-600 to-pink-600',
    icon: 'Layers',
    isFavorite: false,
    members: [MOCK_USERS[1], MOCK_USERS[2]],
    tags: ['Design', 'Tailwind', 'UI/UX'],
    stats: {
      totalTasks: 4,
      todoCount: 1,
      inProgressCount: 2,
      doneCount: 1,
    },
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2 hours ago',
  },
  {
    id: 'board-4',
    title: 'Security & Auth Hardening',
    description: 'JWT rotation, CORS/CSP policy compliance, and audit log pipelines',
    workspaceId: 'ws-1',
    workspaceName: 'Core Engineering',
    color: 'from-amber-600 to-orange-600',
    icon: 'ShieldCheck',
    isFavorite: false,
    members: [MOCK_USERS[0], MOCK_USERS[3]],
    tags: ['Security', 'Auth', 'M2'],
    stats: {
      totalTasks: 3,
      todoCount: 1,
      inProgressCount: 1,
      doneCount: 1,
    },
    createdAt: '2026-08-01T12:00:00Z',
    updatedAt: '1 day ago',
  },
];

export const MOCK_TASKS: Record<string, Task[]> = {
  'board-1': [
    {
      id: 'task-101',
      title: 'Implement WebSocket Heartbeat & Reconnection Backoff',
      description: 'Exponential backoff ping-pong protocol with auto reconnect on disconnect and room state resync.',
      status: 'todo',
      priority: 'high',
      boardId: 'board-1',
      assignee: MOCK_USERS[0],
      tags: ['Backend', 'Network'],
      order: 0,
      version: 1,
      dueDate: '2026-08-14',
      createdAt: '2026-08-14T10:00:00Z',
      updatedAt: '2026-08-14T10:00:00Z',
    },
    {
      id: 'task-102',
      title: 'Add Board Export & JSON Backup Feature',
      description: 'Enable workspace administrators to export full board state as formatted JSON snapshot.',
      status: 'todo',
      priority: 'medium',
      boardId: 'board-1',
      assignee: MOCK_USERS[1],
      tags: ['UX', 'Export'],
      order: 1,
      version: 1,
      dueDate: '2026-08-28',
      createdAt: '2026-08-15T08:30:00Z',
      updatedAt: '2026-08-15T08:30:00Z',
    },
    {
      id: 'task-103',
      title: 'Real-time Cursor Presence & Live Card Drag Broadcasting',
      description: 'Broadcast pointer coordinates and card drag offsets across active WebSocket room members.',
      status: 'in-progress',
      priority: 'urgent',
      boardId: 'board-1',
      assignee: MOCK_USERS[1],
      tags: ['Multiplayer', 'Sockets'],
      order: 0,
      version: 2,
      dueDate: '2026-08-18',
      createdAt: '2026-08-15T11:20:00Z',
      updatedAt: '2026-08-16T09:30:00Z',
    },
    {
      id: 'task-104',
      title: 'Multiplayer Card Lock & Conflict Resolution Modal',
      description: 'Display live editing avatar when a teammate opens a task to prevent concurrent race conditions.',
      status: 'in-progress',
      priority: 'high',
      boardId: 'board-1',
      assignee: MOCK_USERS[2],
      tags: ['Realtime', 'UI'],
      order: 1,
      version: 1,
      dueDate: '2026-08-30',
      createdAt: '2026-08-15T14:15:00Z',
      updatedAt: '2026-08-16T10:00:00Z',
    },
    {
      id: 'task-105',
      title: 'User Authentication & Secure JWT Session Handlers',
      description: 'Stateless access & refresh token rotation with bcrypt password hashing and token blacklist.',
      status: 'done',
      priority: 'medium',
      boardId: 'board-1',
      assignee: MOCK_USERS[0],
      tags: ['Auth', 'Security'],
      order: 0,
      version: 3,
      dueDate: '2026-08-12',
      createdAt: '2026-08-11T08:00:00Z',
      updatedAt: '2026-08-13T16:00:00Z',
    },
  ],
  'board-2': [
    {
      id: 'task-201',
      title: 'Setup IndexedDB Schema using idb library',
      description: 'Configure tasks and syncQueue stores with proper indexes and version migrations.',
      status: 'done',
      priority: 'urgent',
      boardId: 'board-2',
      assignee: MOCK_USERS[0],
      tags: ['IndexedDB', 'Architecture'],
      order: 0,
      version: 1,
      createdAt: '2026-08-12T10:00:00Z',
      updatedAt: '2026-08-13T12:00:00Z',
    },
    {
      id: 'task-202',
      title: 'Implement Mutation Sync Queue with FIFO Replay',
      description: 'Queue optimistic changes made while offline and replay sequentially on reconnect.',
      status: 'done',
      priority: 'high',
      boardId: 'board-2',
      assignee: MOCK_USERS[3],
      tags: ['Offline', 'Sync'],
      order: 1,
      version: 2,
      createdAt: '2026-08-13T09:00:00Z',
      updatedAt: '2026-08-14T15:30:00Z',
    },
    {
      id: 'task-203',
      title: 'Network Listener & Offline Banner Indicator',
      description: 'Hook into navigator.onLine and window online/offline events with toast feedback.',
      status: 'in-progress',
      priority: 'medium',
      boardId: 'board-2',
      assignee: MOCK_USERS[0],
      tags: ['UI', 'Events'],
      order: 0,
      version: 1,
      createdAt: '2026-08-14T11:00:00Z',
      updatedAt: '2026-08-15T14:00:00Z',
    },
    {
      id: 'task-204',
      title: 'Conflict Modal on Version Mismatch',
      description: 'Show server vs client state diff when optimistic lock version conflicts.',
      status: 'todo',
      priority: 'high',
      boardId: 'board-2',
      assignee: MOCK_USERS[3],
      tags: ['Conflict', 'Modal'],
      order: 0,
      version: 1,
      createdAt: '2026-08-15T16:00:00Z',
      updatedAt: '2026-08-15T16:00:00Z',
    },
  ],
  'board-3': [
    {
      id: 'task-301',
      title: 'Tailwind CSS v4 Token Architecture',
      description: 'Consolidate color surfaces, glassmorphism tokens, and custom spacing in index.css.',
      status: 'done',
      priority: 'high',
      boardId: 'board-3',
      assignee: MOCK_USERS[1],
      tags: ['Tailwind', 'CSS'],
      order: 0,
      version: 1,
      createdAt: '2026-08-06T10:00:00Z',
      updatedAt: '2026-08-08T11:00:00Z',
    },
    {
      id: 'task-302',
      title: 'Design Card Drag-and-Drop Dropzones',
      description: 'Create glowing drop target indicators and tactile card pickup animations.',
      status: 'in-progress',
      priority: 'urgent',
      boardId: 'board-3',
      assignee: MOCK_USERS[2],
      tags: ['Micro-interactions', 'DnD'],
      order: 0,
      version: 2,
      createdAt: '2026-08-09T14:00:00Z',
      updatedAt: '2026-08-12T16:20:00Z',
    },
    {
      id: 'task-303',
      title: 'Accessibility & Keyboard Navigation Audit',
      description: 'Ensure focus rings, ARIA labels, and keyboard tab flow comply with WCAG 2.1.',
      status: 'in-progress',
      priority: 'medium',
      boardId: 'board-3',
      assignee: MOCK_USERS[1],
      tags: ['A11y', 'Audit'],
      order: 1,
      version: 1,
      createdAt: '2026-08-10T12:00:00Z',
      updatedAt: '2026-08-14T09:10:00Z',
    },
    {
      id: 'task-304',
      title: 'Dark Mode Glassmorphic Modals',
      description: 'Author reusable modal components with backdrop blur and escape key handlers.',
      status: 'todo',
      priority: 'low',
      boardId: 'board-3',
      assignee: MOCK_USERS[2],
      tags: ['Components', 'Modal'],
      order: 0,
      version: 1,
      createdAt: '2026-08-11T15:00:00Z',
      updatedAt: '2026-08-11T15:00:00Z',
    },
  ],
  'board-4': [
    {
      id: 'task-401',
      title: 'Implement Helmet CSP and Strict CORS Policy',
      description: 'Configure Content-Security-Policy headers and origin whitelist on Express app.',
      status: 'done',
      priority: 'high',
      boardId: 'board-4',
      assignee: MOCK_USERS[0],
      tags: ['Security', 'Headers'],
      order: 0,
      version: 1,
      createdAt: '2026-08-02T10:00:00Z',
      updatedAt: '2026-08-03T14:00:00Z',
    },
    {
      id: 'task-402',
      title: 'Rate Limiting on Authentication Endpoints',
      description: 'Add express-rate-limit middleware for /api/auth/login and /register.',
      status: 'in-progress',
      priority: 'urgent',
      boardId: 'board-4',
      assignee: MOCK_USERS[3],
      tags: ['Auth', 'DDoS'],
      order: 0,
      version: 1,
      createdAt: '2026-08-04T11:00:00Z',
      updatedAt: '2026-08-05T13:00:00Z',
    },
    {
      id: 'task-403',
      title: 'Audit Log Persistence for Board Mutations',
      description: 'Log user ID, timestamp, IP, and mutation action for compliance tracking.',
      status: 'todo',
      priority: 'medium',
      boardId: 'board-4',
      assignee: MOCK_USERS[0],
      tags: ['Audit', 'Database'],
      order: 0,
      version: 1,
      createdAt: '2026-08-05T15:00:00Z',
      updatedAt: '2026-08-05T15:00:00Z',
    },
  ],
};

/* ==========================================================================
   Task Discussion Comments Mock Data
   ========================================================================== */

export const MOCK_COMMENTS: Record<string, TaskComment[]> = {
  'task-101': [
    {
      id: 'comm-101-1',
      taskId: 'task-101',
      author: MOCK_USERS[1],
      content: 'Make sure we cap the reconnection backoff interval at 30 seconds to prevent hanging sockets.',
      createdAt: '2026-08-07T19:30:00Z',
    },
    {
      id: 'comm-101-2',
      taskId: 'task-101',
      author: MOCK_USERS[0],
      content: 'Good call Clara. I added jitter and clamped the maximum backoff to 30s with auto reconnect on focus.',
      createdAt: '2026-08-07T20:15:00Z',
    },
  ],
  'task-103': [
    {
      id: 'comm-103-1',
      taskId: 'task-103',
      author: MOCK_USERS[2],
      content: 'Are we broadcasting cursor positions through raw WebSockets or using WebRTC data channels for lower latency?',
      createdAt: '2026-08-07T21:20:00Z',
    },
    {
      id: 'comm-103-2',
      taskId: 'task-103',
      author: MOCK_USERS[1],
      content: 'Using WebSocket binary packets throttled at 60Hz. It stays well under 15ms latency across our staging nodes.',
      createdAt: '2026-08-07T22:05:00Z',
    },
  ],
  'task-104': [
    {
      id: 'comm-104-1',
      taskId: 'task-104',
      author: MOCK_USERS[0],
      content: 'Conflict resolution should give priority to the most recent server timestamp if optimistic lock fails.',
      createdAt: '2026-08-07T22:45:00Z',
    },
  ],
};

/* ==========================================================================
   User Profile & Identity Mock Data
   ========================================================================== */

export const MOCK_CURRENT_USER: User = MOCK_USERS[0];

export const MOCK_USER_PROFILE = {
  name: 'Alex Chen',
  username: 'alexchen',
  email: 'alex.chen@collabboard.io',
  role: 'Principal Software Architect',
  company: 'CollabBoard Engine',
  location: 'San Francisco, CA',
  bio: 'Specializing in real-time collaborative systems, CRDT state sync, and high-performance WebGL & React interfaces.',
  memberSince: 'Member since Oct 2024',
};

/* ==========================================================================
   User Preferences Mock Data
   ========================================================================== */

export const MOCK_USER_PREFERENCES = {
  emailTaskAssignment: true,
  emailWeeklyDigest: false,
  desktopNotifications: true,
  soundEffects: true,
  compactBoardView: false,
  offlineAutoSync: true,
};

/* ==========================================================================
   Active Security Sessions Mock Data
   ========================================================================== */

export const MOCK_ACTIVE_SESSIONS = [
  {
    id: 'sess-1',
    device: 'Windows 11 • Chrome 124',
    ip: '198.51.100.24',
    location: 'San Francisco, CA',
    lastActive: 'Active Now',
    isCurrent: true,
    iconType: 'laptop' as const,
  },
  {
    id: 'sess-2',
    device: 'iPhone 15 Pro • Mobile Safari',
    ip: '198.51.100.24',
    location: 'San Francisco, CA',
    lastActive: '3 hours ago',
    isCurrent: false,
    iconType: 'smartphone' as const,
  },
];

/* ==========================================================================
   Subscription & Pricing Plans Mock Data
   ========================================================================== */

export const MOCK_SUBSCRIPTION_PLANS = [
  {
    id: 'basic' as const,
    name: 'Basic Plan',
    tierLabel: 'Starter',
    badge: 'Free Forever',
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    annualTotal: 0,
    description: 'Ideal for individual developers, solo project managers, and personal side projects.',
    features: [
      'Up to 3 Workspaces',
      '10 Boards per workspace',
      '5 Collaborators per board',
      'Standard WebSocket cloud sync',
      'Community support & issue tracker',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro Plan',
    tierLabel: 'Professional',
    badge: 'Most Popular',
    isPopular: true,
    monthlyPrice: 12,
    annualPricePerMonth: 9.6,
    annualTotal: 115.2,
    description: 'Engineered for high-velocity software engineering teams, agencies, and cross-functional collaboration.',
    features: [
      'Unlimited Workspaces & Boards',
      'Unlimited Team Members & Guests',
      'Real-Time CRDT State Sync Engine',
      'Custom Roles & Granular Permissions',
      'Custom Workspace Themes & Gradients',
      '24/7 Priority Engineer Support',
    ],
  },
];

/* ==========================================================================
   Billing Information Mock Data
   ========================================================================== */

export const MOCK_BILLING_INFO = {
  paymentCard: 'Mastercard •••• 4242',
  cardBrand: 'Mastercard',
  cardExpiry: '11/28',
  nextInvoiceDate: 'September 22, 2026',
  monthlyRate: '$12.00 USD',
  annualRate: '$115.20 USD',
};

/* ==========================================================================
   Common Gradient Color Options
   ========================================================================== */

export const COLOR_OPTIONS = [
  { label: 'Indigo & Violet', value: 'from-indigo-600 to-violet-600' },
  { label: 'Emerald & Teal', value: 'from-emerald-600 to-teal-600' },
  { label: 'Fuchsia & Pink', value: 'from-fuchsia-600 to-pink-600' },
  { label: 'Amber & Orange', value: 'from-amber-600 to-orange-600' },
  { label: 'Sky & Cyan', value: 'from-sky-600 to-cyan-600' },
];
