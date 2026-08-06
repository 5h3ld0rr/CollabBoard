import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  MapPin,
  Globe,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  KeyRound,
  Laptop,
  Smartphone,
  Sparkles,
  Save,
  ArrowLeft,
  Calendar,
  Check,
  ExternalLink,
  ChevronRight,
  Layers,
  Zap,
  Code2,
  AtSign,
} from 'lucide-react';
import { Navbar, AmbientBackground, Button } from '../components/common';
import { MOCK_USERS, MOCK_WORKSPACES, MOCK_TASKS, MOCK_BOARDS } from '../data/mockData';
import type { Task, TaskStatus } from '../types';

type ProfileTab = 'overview' | 'workspaces' | 'tasks' | 'preferences' | 'security';

interface AvatarGradient {
  id: string;
  name: string;
  gradient: string;
}

const AVATAR_GRADIENTS: AvatarGradient[] = [
  { id: 'indigo', name: 'Indigo Dream', gradient: 'from-indigo-600 to-violet-600' },
  { id: 'cyan', name: 'Ocean Cyan', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'emerald', name: 'Emerald Forest', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'rose', name: 'Rose Sunset', gradient: 'from-rose-500 to-pink-600' },
  { id: 'amber', name: 'Amber Flare', gradient: 'from-amber-500 to-orange-600' },
];

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = MOCK_USERS[0]; // Alex Chen

  // Active tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  // Form State
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState('alexchen');
  const [email, setEmail] = useState(currentUser.email);
  const [role, setRole] = useState('Principal Software Architect');
  const [company, setCompany] = useState('CollabBoard Engine');
  const [location, setLocation] = useState('San Francisco, CA');
  const [bio, setBio] = useState(
    'Specializing in real-time collaborative systems, CRDT state sync, and high-performance WebGL & React interfaces.'
  );
  const [website, setWebsite] = useState('https://alexchen.dev');
  const [githubUser, setGithubUser] = useState('alexchen');
  const [twitterUser, setTwitterUser] = useState('alexchen_dev');
  const [selectedGradient, setSelectedGradient] = useState<string>('from-indigo-600 to-violet-600');

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailTaskAssignment: true,
    emailWeeklyDigest: false,
    desktopNotifications: true,
    soundEffects: true,
    compactBoardView: false,
    offlineAutoSync: true,
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // User tasks state
  const allTasksList: Task[] = Object.values(MOCK_TASKS).flat();
  const [userTasks, setUserTasks] = useState<Task[]>(() =>
    allTasksList.filter((t) => t.assignee?.id === currentUser.id || t.assignee?.name === currentUser.name)
  );
  const [taskFilter, setTaskFilter] = useState<'all' | 'in-progress' | 'todo' | 'done'>('all');

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile details updated successfully!');
  };

  const handlePreferenceToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast(`Preference updated: ${String(key).replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'info');
      return next;
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password', 'info');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'info');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated securely!');
  };

  const toggleTaskStatus = (taskId: string) => {
    setUserTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextStatus: TaskStatus = task.status === 'done' ? 'in-progress' : 'done';
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
    showToast('Task status updated');
  };

  // Filter tasks based on selected tab
  const filteredTasks = userTasks.filter((task) => {
    if (taskFilter === 'all') return true;
    return task.status === taskFilter;
  });

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      <AmbientBackground variant="minimal" />

      {/* Top Navigation */}
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
            }`}
          />
          <span className="text-xs font-medium text-slate-200">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Back Link & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/boards')}
            className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Boards</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>CollabBoard</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-medium">User Profile</span>
          </div>
        </div>

        {/* Profile Header Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-indigo-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              
              {/* Avatar with Gradient selector indicator */}
              <div className="relative group">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br ${selectedGradient} flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl shadow-indigo-950/40 ring-4 ring-slate-800/80 transition-transform duration-300 group-hover:scale-105`}
                >
                  {getInitials(name)}
                </div>
                <span
                  title="Online"
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-slate-900"
                />
              </div>

              {/* Name & Basic Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{name}</h1>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Workspace Owner</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center space-x-2">
                  <span>{role}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{company}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{email}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{location}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Member since Oct 2024</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2.5 self-start md:self-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Profile link copied to clipboard!');
                }}
              >
                Share Profile
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('overview');
                  showToast('Ready to edit profile fields below', 'info');
                }}
              >
                Edit Info
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Workspaces</p>
                <p className="text-sm sm:text-base font-bold text-white">{MOCK_WORKSPACES.length}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Active Boards</p>
                <p className="text-sm sm:text-base font-bold text-white">{MOCK_BOARDS.length}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned Tasks</p>
                <p className="text-sm sm:text-base font-bold text-white">{userTasks.length}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Sync Health</p>
                <p className="text-sm sm:text-base font-bold text-emerald-400">100% Live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Personal Info</span>
          </button>

          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'workspaces'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Workspaces ({MOCK_WORKSPACES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My Tasks ({userTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* Tab 1: Overview & Personal Info */}
        {activeTab === 'overview' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Form Inputs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* General Information Card */}
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h2 className="text-sm font-bold text-white">General Information</h2>
                      <p className="text-xs text-slate-400">Update your public identity and profile details</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                      Live Editable
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Username / Handle</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">@</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Primary Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Job Title / Role</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Company / Organization</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Location / Timezone</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Bio / About Me</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                    />
                  </div>
                </div>

                {/* Social & Web Links */}
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
                  <div className="pb-2 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white">Social & Profiles</h2>
                    <p className="text-xs text-slate-400">Connect your external developer and portfolio accounts</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Website</span>
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                        <Code2 className="w-3.5 h-3.5 text-slate-300" />
                        <span>GitHub</span>
                      </label>
                      <input
                        type="text"
                        value={githubUser}
                        onChange={(e) => setGithubUser(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                        <AtSign className="w-3.5 h-3.5 text-sky-400" />
                        <span>Twitter / X</span>
                      </label>
                      <input
                        type="text"
                        value={twitterUser}
                        onChange={(e) => setTwitterUser(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right 1 Col: Avatar Customizer & Card */}
              <div className="space-y-6">
                
                {/* Avatar Palette Picker */}
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white">Avatar Gradient Theme</h3>
                  <p className="text-xs text-slate-400">Choose the signature gradient for your avatar and active indicators</p>

                  <div className="grid grid-cols-1 gap-2.5">
                    {AVATAR_GRADIENTS.map((item) => {
                      const isSelected = selectedGradient === item.gradient;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedGradient(item.gradient)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${item.gradient} shadow-sm`} />
                            <span className="text-xs font-medium text-slate-200">{item.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Status Card */}
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white">Account Status</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                      <span className="text-slate-400">Plan Tier</span>
                      <span className="font-semibold text-indigo-400">Enterprise Pro</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                      <span className="text-slate-400">WebSocket Node</span>
                      <span className="font-mono text-emerald-400 text-[11px]">us-west-prod-01</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">CRDT Sync Engine</span>
                      <span className="font-medium text-slate-200">v2.4 Optimistic</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/boards')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Workspaces */}
        {activeTab === 'workspaces' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Your Workspaces</h2>
                <p className="text-xs text-slate-400">You are a collaborator or administrator in {MOCK_WORKSPACES.length} team spaces</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/boards')}
              >
                Open Dashboard
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MOCK_WORKSPACES.map((ws) => (
                <div
                  key={ws.id}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${ws.color || 'from-indigo-600 to-violet-600'} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          ws.role === 'Owner'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : ws.role === 'Admin'
                            ? 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {ws.role}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ws.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span>{ws.boardCount} boards</span>
                      <span>•</span>
                      <span>{ws.memberCount} members</span>
                    </div>
                    <Link
                      to="/boards"
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Enter</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: My Assigned Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Assigned Tasks</h2>
                <p className="text-xs text-slate-400">Tasks assigned to {name} across all active boards</p>
              </div>

              {/* Task status filter */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({userTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('in-progress')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === 'in-progress' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setTaskFilter('todo')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === 'todo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => setTaskFilter('done')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === 'done' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No tasks in this view</p>
                <p className="text-xs text-slate-500">You're all caught up on your assigned items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between gap-4 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'border-slate-700 hover:border-indigo-500 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isDone ? 'text-slate-500 line-through' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="text-indigo-400 font-medium">Board #{task.boardId}</span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : task.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            task.status === 'done'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : task.status === 'in-progress'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.status === 'in-progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'To Do'}
                        </span>
                        <Link
                          to={`/boards/${task.boardId}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Open Board"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">Notifications & Alerts</h2>
                <p className="text-xs text-slate-400">Control how and when you receive workspace notifications</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Email task assignments</p>
                    <p className="text-[11px] text-slate-400">Receive an email when you are assigned or mentioned in a card</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('emailTaskAssignment')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.emailTaskAssignment ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.emailTaskAssignment ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Weekly activity summary digest</p>
                    <p className="text-[11px] text-slate-400">Receive weekly email roundup of workspace velocity</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('emailWeeklyDigest')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.emailWeeklyDigest ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.emailWeeklyDigest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Desktop push notifications</p>
                    <p className="text-[11px] text-slate-400">Show native browser toasts for real-time task moves</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('desktopNotifications')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.desktopNotifications ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.desktopNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Real-time sound cues</p>
                    <p className="text-[11px] text-slate-400">Play subtle audio chime when teammates drop cards</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('soundEffects')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.soundEffects ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.soundEffects ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">Board Display & Sync</h2>
                <p className="text-xs text-slate-400">Customize your board viewing experience and offline behavior</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Compact Kanban density</p>
                    <p className="text-[11px] text-slate-400">Reduce task card padding to fit more items on screen</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('compactBoardView')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.compactBoardView ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.compactBoardView ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Offline Automatic Sync</p>
                    <p className="text-[11px] text-slate-400">Queue mutations in IndexedDB when disconnected and flush on reconnect</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('offlineAutoSync')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.offlineAutoSync ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.offlineAutoSync ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security & Active Sessions */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-4xl">
            
            {/* Change Password */}
            <form onSubmit={handlePasswordUpdate} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">Update Password</h2>
                <p className="text-xs text-slate-400">Ensure your account is using a secure and unique password</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" className="space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>

            {/* Two Factor Authentication Card */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h2>
                  <p className="text-xs text-slate-400">Protect your CollabBoard workspaces with hardware or app-based 2FA</p>
                </div>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active & Protected</span>
                </span>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white">Active Device Sessions</h2>
                  <p className="text-xs text-slate-400">Devices currently authenticated to your account</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => showToast('All other sessions revoked successfully')}
                >
                  Revoke Other Sessions
                </Button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 flex items-center space-x-2">
                        <span>Windows 11 • Chrome 124</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          Current Device
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">San Francisco, CA • IP: 198.51.100.24</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-400">Active Now</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">iPhone 15 Pro • Mobile Safari</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">San Francisco, CA • 3 hours ago</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('Device logged out')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default Profile;
