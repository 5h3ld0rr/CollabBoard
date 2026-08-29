/* ==========================================================================
   CollabBoard UI Constants & Theme Configurations
   ========================================================================== */

export const COLOR_OPTIONS = [
  { label: 'Indigo & Violet', value: 'from-indigo-600 to-violet-600' },
  { label: 'Emerald & Teal', value: 'from-emerald-600 to-teal-600' },
  { label: 'Fuchsia & Pink', value: 'from-fuchsia-600 to-pink-600' },
  { label: 'Amber & Orange', value: 'from-amber-600 to-orange-600' },
  { label: 'Sky & Cyan', value: 'from-sky-600 to-cyan-600' },
];

export const STATUS_COLUMNS = [
  { id: 'todo', title: 'To Do', description: 'Upcoming backlog & scheduled work' },
  { id: 'doing', title: 'In Progress', description: 'Actively in development' },
  { id: 'done', title: 'Completed', description: 'Tested & delivered items' },
] as const;

export const DEFAULT_USER_PREFERENCES = {
  emailTaskAssignment: true,
  emailWeeklyDigest: false,
  desktopNotifications: true,
  soundEffects: true,
  compactBoardView: false,
  offlineAutoSync: true,
};

export const DEFAULT_ACTIVE_SESSIONS = [
  {
    id: 'sess-1',
    device: 'Windows 11 • Chrome',
    ip: '127.0.0.1',
    location: 'Current Device',
    lastActive: 'Active Now',
    isCurrent: true,
    iconType: 'laptop' as const,
  },
];

export const SUBSCRIPTION_PLANS = [
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
      'Standard cloud sync',
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
      'Real-Time State Sync Engine',
      'Custom Roles & Granular Permissions',
      'Custom Workspace Themes & Gradients',
      '24/7 Priority Engineer Support',
    ],
  },
];
