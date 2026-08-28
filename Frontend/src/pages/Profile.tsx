import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  KeyRound,
  Laptop,
  Smartphone,
  Sparkles,
  Save,
  Calendar,
  Check,
  ExternalLink,
  ChevronRight,
  Layers,
  Zap,
  Crown,
  CreditCard,
  Settings,
} from "lucide-react";
import {
  Navbar,
  AmbientBackground,
  Button,
  BackButton,
} from "../components/common";
import { ManageWorkspaceModal } from "../components/workspace";
import { useAuth, useBoard } from "../context";
import {
  getWorkspaces,
  updateWorkspace as apiUpdateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
} from "../api";
import {
  DEFAULT_USER_PREFERENCES,
  DEFAULT_ACTIVE_SESSIONS,
  SUBSCRIPTION_PLANS,
} from "../constants";
import type { Task, TaskStatus, Workspace, User } from "../types";

type ProfileTab =
  | "overview"
  | "workspaces"
  | "subscription"
  | "tasks"
  | "preferences"
  | "security";

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { state: { boards: contextBoards, tasks: contextTasks } } = useBoard();

  const currentUser: User = authUser || {
    id: "usr-1",
    name: "Alex Chen",
    email: "user1@nsbm.lk",
    initials: "AC",
    color: "bg-indigo-600",
  };

  // Active tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Saved & Form State
  const [savedProfile, setSavedProfile] = useState({
    name: currentUser.name,
    username: currentUser.email.split("@")[0],
    email: currentUser.email,
    role: "Lead Full-Stack Engineer",
    company: "CollabBoard Labs",
    location: "San Francisco, CA",
    bio: "Specializing in real-time collaborative systems, CRDT state sync, and high-performance WebGL & React interfaces.",
    memberSince: "Member since Oct 2024",
  });

  const [name, setName] = useState(savedProfile.name);
  const [username, setUsername] = useState(savedProfile.username);
  const [email, setEmail] = useState(savedProfile.email);
  const [role, setRole] = useState(savedProfile.role);
  const [company, setCompany] = useState(savedProfile.company);
  const [location, setLocation] = useState(savedProfile.location);
  const [bio, setBio] = useState(savedProfile.bio);
  const [subscriptionPlan, setSubscriptionPlan] = useState<"basic" | "pro">(
    "pro",
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  // Check if any personal info field has unsaved changes
  const isProfileDirty =
    name !== savedProfile.name ||
    username !== savedProfile.username ||
    email !== savedProfile.email ||
    role !== savedProfile.role ||
    company !== savedProfile.company ||
    location !== savedProfile.location ||
    bio !== savedProfile.bio;

  // Preferences state
  const [preferences, setPreferences] = useState(DEFAULT_USER_PREFERENCES);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [managingWorkspace, setManagingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isManageWorkspaceModalOpen, setIsManageWorkspaceModalOpen] =
    useState(false);

  useEffect(() => {
    async function load() {
      const list = await getWorkspaces();
      setWorkspaces(list);
    }
    load();
  }, []);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info";
  } | null>(null);

  // User tasks state
  const allTasksList: Task[] = contextTasks;
  const [userTasks, setUserTasks] = useState<Task[]>(() =>
    allTasksList.filter(
      (t) =>
        t.assignee?.id === currentUser.id ||
        t.assignee?.name === currentUser.name,
    ),
  );
  const [taskFilter, setTaskFilter] = useState<
    "all" | "in-progress" | "todo" | "done"
  >("all");

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedProfile({
      name,
      username,
      email,
      role,
      company,
      location,
      bio,
      memberSince: savedProfile.memberSince,
    });
    showToast("Profile details updated successfully!");
  };

  const handleCancelProfile = () => {
    setName(savedProfile.name);
    setUsername(savedProfile.username);
    setEmail(savedProfile.email);
    setRole(savedProfile.role);
    setCompany(savedProfile.company);
    setLocation(savedProfile.location);
    setBio(savedProfile.bio);
    showToast("Changes discarded", "info");
  };

  const handlePreferenceToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast(
        `Preference updated: ${String(key)
          .replace(/([A-Z])/g, " $1")
          .toLowerCase()}`,
        "info",
      );
      return next;
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast("Please enter your current password", "info");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast("New password must be at least 8 characters", "info");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "info");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated securely!");
  };

  const toggleTaskStatus = (taskId: string) => {
    setUserTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextStatus: TaskStatus =
            task.status === "done" ? "in-progress" : "done";
          return { ...task, status: nextStatus };
        }
        return task;
      }),
    );
    showToast("Task status updated");
  };

  // Filter tasks based on selected tab
  const filteredTasks = userTasks.filter((task) => {
    if (taskFilter === "all") return true;
    return task.status === taskFilter;
  });

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      <AmbientBackground variant="minimal" />

      {/* Top Navigation */}
      <Navbar variant="profile" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === "success"
                ? "bg-emerald-400 animate-pulse"
                : "bg-indigo-400"
            }`}
          />
          <span className="text-xs font-medium text-slate-200">
            {toastMessage.text}
          </span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Navigation Button */}
        <div>
          <BackButton to="/dashboard" label="Back to Boards" />
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
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br ${currentUser.color || "from-indigo-600 to-violet-600"} flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl shadow-indigo-950/40 ring-4 ring-slate-800/80 transition-transform duration-300 group-hover:scale-105`}
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
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {name}
                  </h1>
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
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Workspaces</p>
                <p className="text-sm sm:text-base font-bold text-white">
                  {workspaces.length}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Active Boards</p>
                <p className="text-sm sm:text-base font-bold text-white">
                  {contextBoards.length}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned Tasks</p>
                <p className="text-sm sm:text-base font-bold text-white">
                  {userTasks.length}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Sync Health</p>
                <p className="text-sm sm:text-base font-bold text-emerald-400">
                  100% Live
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Personal Info</span>
          </button>

          <button
            onClick={() => setActiveTab("workspaces")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "workspaces"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Workspaces ({workspaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("subscription")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "subscription"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Subscription & Plans</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "tasks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My Tasks ({userTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "preferences"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* Tab 1: Overview & Personal Info */}
        {activeTab === "overview" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* General Information Card */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    General Information
                  </h2>
                  <p className="text-xs text-slate-400">
                    Update your public identity and profile details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      @
                    </span>
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
                  <label className="text-xs font-medium text-slate-300">
                    Primary Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Location / Timezone
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Bio / About Me
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>

            {/* Save & Cancel Buttons - Visible only when form is modified */}
            {isProfileDirty && (
              <div className="flex items-center justify-end space-x-3 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelProfile}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            )}
          </form>
        )}

        {/* Tab: Subscription & Plans */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  Subscription & Plans
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    subscriptionPlan === "pro"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {subscriptionPlan === "pro"
                    ? "Pro Tier Active"
                    : "Basic Tier Active"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Choose the plan that suits your collaboration needs. Upgrade,
                downgrade, or cancel anytime.
              </p>
            </div>

            {/* Plans Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Plan Card */}
              {(() => {
                const basicPlan = SUBSCRIPTION_PLANS[0];
                return (
                  <div
                    className={`rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all relative ${
                      subscriptionPlan === "basic"
                        ? "bg-slate-900/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-950/30"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {basicPlan.tierLabel}
                          </span>
                          <h3 className="text-xl font-black text-white mt-0.5">
                            {basicPlan.name}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {basicPlan.badge}
                        </span>
                      </div>

                      <div className="flex items-baseline space-x-1 mb-4">
                        <span className="text-3xl sm:text-4xl font-black text-white">
                          ${basicPlan.monthlyPrice}
                        </span>
                        <span className="text-xs text-slate-400">/ month</span>
                      </div>

                      <p className="text-xs text-slate-400 pb-6 mb-6 border-b border-slate-800/80">
                        {basicPlan.description}
                      </p>

                      <div className="space-y-3 text-xs text-slate-300">
                        {basicPlan.features.map((feat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8">
                      {subscriptionPlan === "basic" ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold text-center border border-slate-700">
                          Current Active Plan
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            setSubscriptionPlan("basic");
                            showToast("Switched to Basic Plan", "info");
                          }}
                        >
                          Downgrade to Basic
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Pro Plan Card */}
              {(() => {
                const proPlan = SUBSCRIPTION_PLANS[1];
                return (
                  <div
                    className={`rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all relative overflow-hidden ${
                      subscriptionPlan === "pro"
                        ? "bg-linear-to-b from-indigo-950/40 via-slate-900/90 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-950/50"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Popular Pill */}
                    {proPlan.badge && (
                      <div className="absolute top-0 right-0 bg-linear-to-l from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-bl-2xl shadow-md">
                        {proPlan.badge}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                            {proPlan.tierLabel}
                          </span>
                          <h3 className="text-xl font-black text-white mt-0.5">
                            {proPlan.name}
                          </h3>
                        </div>
                      </div>

                      {/* Pricing & Billing Cycle Toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-3xl sm:text-4xl font-black text-white">
                            {billingCycle === "yearly"
                              ? `$${proPlan.annualPricePerMonth.toFixed(2).replace(/\.00$/, "")}`
                              : `$${proPlan.monthlyPrice}`}
                          </span>
                          <span className="text-xs text-slate-400">
                            / mo{" "}
                            {billingCycle === "yearly" && "(billed annually)"}
                          </span>
                        </div>

                        {/* Billing Switcher */}
                        <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-950/90 border border-slate-800 shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              billingCycle === "monthly"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingCycle("yearly")}
                            className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              billingCycle === "yearly"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>Annual</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Save 20%
                            </span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 pb-6 mb-6 border-b border-slate-800/80">
                        {proPlan.description}
                      </p>

                      <div className="space-y-3 text-xs text-slate-200">
                        {proPlan.features.map((feat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2.5"
                          >
                            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8">
                      {subscriptionPlan === "pro" ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold text-center flex items-center justify-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Current Active Subscription</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full shadow-xl shadow-indigo-950/60"
                          icon={<Sparkles className="w-4 h-4" />}
                          onClick={() => {
                            setSubscriptionPlan("pro");
                            showToast("Upgraded to Pro Plan!");
                          }}
                        >
                          Upgrade to Pro (
                          {billingCycle === "yearly" ? "$115.20/yr" : "$12/mo"})
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Billing & Payment Details Card */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <span>Billing & Payment Method</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage your card details and billing addresses
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showToast("Redirecting to secure billing portal...", "info")
                  }
                >
                  Manage Billing
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                  <span className="text-slate-400 text-[11px] block">
                    Payment Method
                  </span>
                  <div className="flex items-center space-x-2 font-medium text-slate-400">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>No payment method attached</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Add a payment method upon plan upgrade
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                  <span className="text-slate-400 text-[11px] block">
                    Active Workspaces
                  </span>
                  <p className="font-semibold text-white">
                    {workspaces.length} of{" "}
                    {subscriptionPlan === "pro" ? "Unlimited" : "3"}
                  </p>
                  <span className="text-[10px] text-indigo-400 block font-mono">
                    Status: Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Workspaces */}
        {activeTab === "workspaces" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Your Workspaces
                </h2>
                <p className="text-xs text-slate-400">
                  You are a collaborator or administrator in{" "}
                  {workspaces.length} team spaces
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Open Dashboard
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workspaces.map((ws: Workspace) => (
                <div
                  key={ws.id}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl bg-linear-to-br ${ws.color || "from-indigo-600 to-violet-600"} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                      >
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setManagingWorkspace(ws);
                            setIsManageWorkspaceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                          title="Workspace Settings"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            ws.role === "Owner"
                              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                              : ws.role === "Admin"
                                ? "bg-violet-500/10 text-violet-300 border-violet-500/30"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {ws.role}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {ws.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span>{ws.boardCount} boards</span>
                      <span>•</span>
                      <span>{ws.memberCount} members</span>
                    </div>
                    <Link
                      to="/dashboard"
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
        {activeTab === "tasks" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Assigned Tasks
                </h2>
                <p className="text-xs text-slate-400">
                  Tasks assigned to {name} across all active boards
                </p>
              </div>

              {/* Task status filter */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === "all"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({userTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("in-progress")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === "in-progress"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setTaskFilter("todo")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === "todo"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => setTaskFilter("done")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    taskFilter === "done"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  No tasks in this view
                </p>
                <p className="text-xs text-slate-500">
                  You're all caught up on your assigned items
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "done";
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
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "border-slate-700 hover:border-indigo-500 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isDone
                                ? "text-slate-500 line-through"
                                : "text-slate-200"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="text-indigo-400 font-medium">
                              Board #{task.boardId}
                            </span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                                task.priority === "urgent"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : task.priority === "high"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-slate-800 text-slate-400"
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
                            task.status === "done"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : task.status === "in-progress"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {task.status === "in-progress"
                            ? "In Progress"
                            : task.status === "done"
                              ? "Done"
                              : "To Do"}
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
        {activeTab === "preferences" && (
          <div className="space-y-6 max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">
                  Notifications & Alerts
                </h2>
                <p className="text-xs text-slate-400">
                  Control how and when you receive workspace notifications
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Email task assignments
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Receive an email when you are assigned or mentioned in a
                      card
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handlePreferenceToggle("emailTaskAssignment")
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.emailTaskAssignment
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.emailTaskAssignment
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Weekly activity summary digest
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Receive weekly email roundup of workspace velocity
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle("emailWeeklyDigest")}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.emailWeeklyDigest
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.emailWeeklyDigest
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Desktop push notifications
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Show native browser toasts for real-time task moves
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handlePreferenceToggle("desktopNotifications")
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.desktopNotifications
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.desktopNotifications
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Real-time sound cues
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Play subtle audio chime when teammates drop cards
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle("soundEffects")}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.soundEffects
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.soundEffects
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">
                  Board Display & Sync
                </h2>
                <p className="text-xs text-slate-400">
                  Customize your board viewing experience and offline behavior
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Compact Kanban density
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Reduce task card padding to fit more items on screen
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle("compactBoardView")}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.compactBoardView
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.compactBoardView
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Offline Automatic Sync
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Queue mutations in IndexedDB when disconnected and flush
                      on reconnect
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle("offlineAutoSync")}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      preferences.offlineAutoSync
                        ? "bg-indigo-600"
                        : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        preferences.offlineAutoSync
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security & Active Sessions */}
        {activeTab === "security" && (
          <div className="space-y-6 max-w-4xl">
            {/* Change Password */}
            <form
              onSubmit={handlePasswordUpdate}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5"
            >
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">
                  Update Password
                </h2>
                <p className="text-xs text-slate-400">
                  Ensure your account is using a secure and unique password
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Confirm Password
                  </label>
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Update Password
                </Button>
              </div>
            </form>

            {/* Two Factor Authentication Card */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Two-Factor Authentication (2FA)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Protect your CollabBoard workspaces with hardware or
                    app-based 2FA
                  </p>
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
                  <h2 className="text-sm font-bold text-white">
                    Active Device Sessions
                  </h2>
                  <p className="text-xs text-slate-400">
                    Devices currently authenticated to your account
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showToast("All other sessions revoked successfully")
                  }
                >
                  Revoke Other Sessions
                </Button>
              </div>

              <div className="space-y-3">
                {DEFAULT_ACTIVE_SESSIONS.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-xl ${
                          session.isCurrent
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {session.iconType === "laptop" ? (
                          <Laptop className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 flex items-center space-x-2">
                          <span>{session.device}</span>
                          {session.isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              Current Device
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {session.location} • IP: {session.ip}
                          {!session.isCurrent && ` • ${session.lastActive}`}
                        </p>
                      </div>
                    </div>
                    {session.isCurrent ? (
                      <span className="text-[11px] font-medium text-emerald-400">
                        Active Now
                      </span>
                    ) : (
                      <button
                        onClick={() => showToast("Device logged out")}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                      >
                        Log Out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manage Workspace Settings Modal */}
      {isManageWorkspaceModalOpen && managingWorkspace && (
        <ManageWorkspaceModal
          isOpen={isManageWorkspaceModalOpen}
          onClose={() => setIsManageWorkspaceModalOpen(false)}
          workspace={managingWorkspace}
          onUpdateWorkspace={async (updatedWs) => {
            try {
              const updated = await apiUpdateWorkspace(updatedWs.id, updatedWs);
              setWorkspaces((prev) =>
                prev.map((w) => (w.id === updated.id ? updated : w)),
              );
              setManagingWorkspace(updated);
              showToast(`Workspace "${updated.name}" updated!`);
            } catch {
              showToast("Failed to update workspace", "info");
            }
          }}
          onDeleteWorkspace={async (id) => {
            try {
              await apiDeleteWorkspace(id);
              setWorkspaces((prev) => prev.filter((w) => w.id !== id));
              setIsManageWorkspaceModalOpen(false);
              showToast("Workspace deleted", "info");
            } catch {
              showToast("Failed to delete workspace", "info");
            }
          }}
        />
      )}
    </div>
  );
};

export default Profile;
