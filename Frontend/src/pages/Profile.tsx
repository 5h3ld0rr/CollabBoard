import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  KeyRound,
  Laptop,
  Smartphone,
  Sparkles,
  Calendar,
  Check,
  ExternalLink,
  ChevronRight,
  Layers,
  Zap,
  Crown,
  CreditCard,
  Settings,
  Pencil,
  X,
  Camera,
  Trash2,
  Loader2,
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
  updatePassword as apiUpdatePassword,
} from "../api";
import {
  getRandomGradient,
  DEFAULT_USER_PREFERENCES,
  SUBSCRIPTION_PLANS,
} from "../constants";
import { saveCachedProfileDetails, getCachedProfileDetails } from "../db";
import type { Task, TaskStatus, Workspace, User, ActiveSession } from "../types";
import {
  getInitials as extractInitials,
  getProfileGradient,
  playNotificationSound,
  detectCurrentDevice,
} from "../utils";

type ProfileTab =
  | "workspaces"
  | "subscription"
  | "tasks"
  | "preferences"
  | "security";

interface UserProfileDetails {
  name: string;
  email: string;
  memberSince: string;
  avatar?: string;
  color?: string;
  subscriptionPlan?: "basic" | "pro";
  billingCycle?: "monthly" | "yearly";
}

function resizeImageToBase64(file: File, maxSize: number = 320, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to process image canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image file"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function formatMemberSince(createdAt?: string | Date, userId?: string): string {
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        const month = d.toLocaleString("en-US", { month: "short" });
        const year = d.getFullYear();
        return `Member since ${month} ${year}`;
      }
    } catch {
      // fallback
    }
  }

  if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
    try {
      const timestamp = parseInt(userId.substring(0, 8), 16) * 1000;
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        const month = d.toLocaleString("en-US", { month: "short" });
        const year = d.getFullYear();
        return `Member since ${month} ${year}`;
      }
    } catch {
      // fallback
    }
  }

  return "Member since Oct 2024";
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: authUser, updateUser } = useAuth();
  const { state: { boards: contextBoards, tasks: contextTasks } } = useBoard();

  const currentUser: User = authUser || {
    id: "usr-1",
    name: "Alex Chen",
    email: "user1@nsbm.lk",
    initials: "AC",
    color: "from-indigo-600 to-violet-600",
    createdAt: "2024-10-15T00:00:00.000Z",
  };

  const validTabs: ProfileTab[] = [
    "workspaces",
    "subscription",
    "tasks",
    "preferences",
    "security",
  ];

  // Derive active tab from ?tab= query parameter, defaulting to "workspaces"
  const tabParam = searchParams.get("tab") as ProfileTab | null;
  const activeTab: ProfileTab =
    tabParam && validTabs.includes(tabParam) ? tabParam : "workspaces";

  const handleTabChange = (tab: ProfileTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  // Saved & Form State
  const [savedProfile, setSavedProfile] = useState<UserProfileDetails>(() => {
    const initialColor = currentUser.color || getRandomGradient();
    return {
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar || "",
      memberSince: formatMemberSince(currentUser.createdAt, currentUser.id),
      color: initialColor,
    };
  });

  const [name, setName] = useState(savedProfile.name);
  const [email, setEmail] = useState(savedProfile.email);
  const [selectedColor, setSelectedColor] = useState<string>(
    savedProfile.color || getRandomGradient(),
  );
  const [subscriptionPlan, setSubscriptionPlan] = useState<"basic" | "pro">(
    authUser?.subscriptionPlan || "pro",
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    authUser?.billingCycle || "monthly",
  );

  // Plan and billing cycle persistence handlers
  const handleSelectPlan = async (
    newPlan: "basic" | "pro",
    cycle?: "monthly" | "yearly",
  ) => {
    if (newPlan === "pro") {
      return;
    }
    const nextCycle = cycle || billingCycle;
    setSubscriptionPlan(newPlan);
    if (cycle) setBillingCycle(cycle);

    const updated: UserProfileDetails = {
      ...savedProfile,
      subscriptionPlan: newPlan,
      billingCycle: nextCycle,
    };
    setSavedProfile(updated);
    saveCachedProfileDetails(updated);

    try {
      await updateUser({
        subscriptionPlan: newPlan,
        billingCycle: nextCycle,
      });
      showToast("Switched to Basic Plan", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update subscription", "info");
    }
  };

  const handleSelectBillingCycle = async (newCycle: "monthly" | "yearly") => {
    setBillingCycle(newCycle);
    const updated: UserProfileDetails = {
      ...savedProfile,
      subscriptionPlan,
      billingCycle: newCycle,
    };
    setSavedProfile(updated);
    saveCachedProfileDetails(updated);
    try {
      await updateUser({
        subscriptionPlan,
        billingCycle: newCycle,
      });
    } catch {
      // Ignored
    }
  };

  // Inline name editing state in hero banner
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(savedProfile.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveInlineName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) {
      showToast("Name cannot be empty", "error");
      return;
    }
    if (trimmed === name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      setName(trimmed);
      const updated = {
        ...savedProfile,
        name: trimmed,
      };
      setSavedProfile(updated);
      saveCachedProfileDetails(updated);
      await updateUser({ name: trimmed });
      showToast(`Name updated to "${trimmed}"!`, "success");
      setIsEditingName(false);
    } catch (err: any) {
      showToast(err.message || "Failed to update name", "info");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelInlineName = () => {
    setTempName(name);
    setIsEditingName(false);
  };

  // Load cached profile from PouchDB and keep synced with authUser
  useEffect(() => {
    async function loadPouchProfile() {
      try {
        const cached = await getCachedProfileDetails();
        if (cached) {
          const effectiveCreatedAt = authUser?.createdAt || cached.createdAt || currentUser.createdAt;
          const memberDate = formatMemberSince(effectiveCreatedAt, authUser?.id || currentUser.id);
          const activePlan = authUser?.subscriptionPlan || cached.subscriptionPlan || "pro";
          const activeCycle = authUser?.billingCycle || cached.billingCycle || "monthly";
          const merged: UserProfileDetails = {
            ...cached,
            name: authUser?.name || cached.name,
            email: authUser?.email || cached.email,
            avatar: authUser?.avatar !== undefined ? authUser.avatar : cached.avatar,
            memberSince: memberDate,
            subscriptionPlan: activePlan,
            billingCycle: activeCycle,
          };
          setSavedProfile(merged);
          setName(merged.name);
          setTempName(merged.name);
          setEmail(merged.email);
          setSubscriptionPlan(activePlan);
          setBillingCycle(activeCycle);
          const resolvedColor = authUser?.color || merged.color;
          if (resolvedColor) {
            setSelectedColor(resolvedColor);
          }
          return;
        }
      } catch {
        // Fallback to authUser
      }

      if (authUser) {
        setName(authUser.name);
        setTempName(authUser.name);
        setEmail(authUser.email);
        const userColor = authUser.color || getRandomGradient();
        setSelectedColor(userColor);
        const activePlan = authUser.subscriptionPlan || "pro";
        const activeCycle = authUser.billingCycle || "monthly";
        setSubscriptionPlan(activePlan);
        setBillingCycle(activeCycle);
        setSavedProfile((prev) => ({
          ...prev,
          name: authUser.name,
          email: authUser.email,
          avatar: authUser.avatar || "",
          memberSince: formatMemberSince(authUser.createdAt, authUser.id),
          color: userColor,
          subscriptionPlan: activePlan,
          billingCycle: activeCycle,
        }));
      }
    }
    loadPouchProfile();
  }, [authUser, currentUser.createdAt, currentUser.id]);

  useEffect(() => {
    if (authUser?.color) {
      setSelectedColor(authUser.color);
    }
  }, [authUser?.color]);

  useEffect(() => {
    if (authUser?.avatar !== undefined) {
      setSavedProfile((prev) => ({ ...prev, avatar: authUser.avatar }));
    }
  }, [authUser?.avatar]);

  // Profile picture upload / removal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WebP)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be less than 10MB", "error");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const resizedBase64 = await resizeImageToBase64(file, 320, 0.85);
      const updated: UserProfileDetails = {
        ...savedProfile,
        avatar: resizedBase64,
      };
      setSavedProfile(updated);
      saveCachedProfileDetails(updated);

      await updateUser({ avatar: resizedBase64 });
      showToast("Profile picture updated successfully!", "success");
    } catch (err: any) {
      console.error("Failed to upload profile picture:", err);
      showToast(err.message || "Failed to update profile picture", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!savedProfile.avatar) return;
    setIsUploadingAvatar(true);
    try {
      const updated: UserProfileDetails = {
        ...savedProfile,
        avatar: "",
      };
      setSavedProfile(updated);
      saveCachedProfileDetails(updated);

      await updateUser({ avatar: "" });
      showToast("Profile picture removed", "success");
    } catch (err: any) {
      console.error("Failed to remove profile picture:", err);
      showToast(err.message || "Failed to remove profile picture", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Preferences state - persisted to localStorage
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem("user_profile_preferences");
      if (stored) {
        return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_USER_PREFERENCES;
  });

  const handlePreferenceToggle = async (key: keyof typeof preferences) => {
    const nextVal = !preferences[key];

    if (key === "desktopNotifications") {
      if (nextVal) {
        if (!("Notification" in window)) {
          showToast("Desktop notifications are not supported in this browser", "error");
          return;
        }

        if (Notification.permission === "denied") {
          showToast(
            "Notifications are blocked in your browser settings. Please enable them in your address bar.",
            "error",
          );
          return;
        }

        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            showToast("Desktop notification permission was not granted", "info");
            return;
          }
        }

        try {
          new window.Notification("CollabBoard", {
            body: "Desktop push notifications are enabled!",
            icon: "/favicon.ico",
          });
        } catch {
          // Ignore
        }
        showToast("Desktop push notifications enabled!", "success");
      } else {
        showToast("Desktop push notifications disabled", "info");
      }
    }

    if (key === "soundEffects") {
      if (nextVal) {
        playNotificationSound();
        showToast("Sound cues enabled", "success");
      } else {
        showToast("Sound cues muted", "info");
      }
    }

    const updated = { ...preferences, [key]: nextVal };
    setPreferences(updated);
    try {
      localStorage.setItem("user_profile_preferences", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };


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
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Active device sessions state with dynamic device detection & localStorage persistence
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(() => {
    const current = detectCurrentDevice();
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    const currentSession: ActiveSession = {
      id: "current-session",
      device: current.device,
      browser: current.browser,
      ip: isLocal ? "127.0.0.1" : "Client IP",
      location: "Local Network",
      lastActive: "Active Now",
      isCurrent: true,
      iconType: current.iconType,
    };

    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("collabboard_active_sessions");
      if (stored) {
        try {
          const parsed: ActiveSession[] = JSON.parse(stored);
          const others = parsed.filter((s) => !s.isCurrent);
          return [currentSession, ...others];
        } catch {
          // ignore corrupted data
        }
      }
    }

    // Realistic secondary sessions for interactive testing and management
    return [
      currentSession,
      {
        id: "sess-mobile-ios",
        device: "iOS • Safari Mobile",
        browser: "Safari Mobile",
        ip: "192.168.1.104",
        location: "Mobile Device",
        lastActive: "2 hours ago",
        isCurrent: false,
        iconType: "smartphone",
      },
      {
        id: "sess-macos-chrome",
        device: "macOS • Chrome",
        browser: "Chrome",
        ip: "192.168.1.145",
        location: "Office Workstation",
        lastActive: "Yesterday at 4:15 PM",
        isCurrent: false,
        iconType: "laptop",
      },
    ];
  });

  // Sync active sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "collabboard_active_sessions",
        JSON.stringify(activeSessions),
      );
    } catch {
      // ignore
    }
  }, [activeSessions]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // User tasks state
  const allTasksList: Task[] = contextTasks;
  const [userTasks, setUserTasks] = useState<Task[]>(() =>
    allTasksList.filter(
      (t) =>
        t.assignee?.id === currentUser.id ||
        t.assignee?.name?.toLowerCase() === currentUser.name.toLowerCase(),
    ),
  );

  const [taskFilter, setTaskFilter] = useState<
    "all" | "in-progress" | "todo" | "done"
  >("all");

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
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

    try {
      setIsUpdatingPassword(true);
      await apiUpdatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated securely!");
    } catch (err: any) {
      const errorMsg =
        err?.message || "Failed to update password. Please check your credentials.";
      showToast(errorMsg, "info");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const otherSessionsCount = activeSessions.filter((s) => !s.isCurrent).length;

  const handleRevokeOtherSessions = () => {
    if (otherSessionsCount === 0) {
      showToast("No other active sessions to revoke", "info");
      return;
    }
    setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast(
      `Revoked ${otherSessionsCount} other session${otherSessionsCount > 1 ? "s" : ""} successfully!`,
      "success",
    );
  };

  const handleLogoutSession = (sessionId: string, deviceName: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast(`${deviceName} session logged out successfully!`, "info");
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
    return extractInitials(fullName);
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
                : toastMessage.type === "error"
                  ? "bg-rose-400"
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
          <BackButton to="/dashboard" label="Back" />
        </div>

        {/* Profile Header Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-indigo-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Profile Avatar */}
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="relative group">
                  <div
                    data-testid="profile-avatar-hero"
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${
                      savedProfile.avatar
                        ? "bg-slate-900 ring-2 ring-indigo-500/30"
                        : getProfileGradient(selectedColor || currentUser.color, name)
                    } flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl shadow-indigo-950/40 ring-4 ring-slate-800/80 transition-all duration-300 group-hover:scale-105 overflow-hidden relative`}
                  >
                    {savedProfile.avatar ? (
                      <img
                        src={savedProfile.avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(name)
                    )}

                    {/* Loading spinner overlay */}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      </div>
                    )}

                    {/* Hover Change Button Overlay */}
                    {!isUploadingAvatar && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity duration-200 cursor-pointer backdrop-blur-[2px] z-10"
                        title="Change profile picture"
                        aria-label="Change profile picture"
                      >
                        <Camera className="w-5 h-5 text-white drop-shadow" />
                        <span className="text-[10px] font-semibold tracking-tight">Change</span>
                      </button>
                    )}
                  </div>

                  {/* Online indicator */}
                  <span
                    title="Online"
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-slate-900 pointer-events-none z-20"
                  />

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                  />
                </div>

                {/* Avatar action buttons below */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-indigo-300 bg-slate-800/70 hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{savedProfile.avatar ? "Change" : "Upload photo"}</span>
                  </button>

                  {savedProfile.avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      title="Remove profile picture"
                      aria-label="Remove profile picture"
                      className="p-1 text-slate-400 hover:text-rose-400 bg-slate-800/70 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Name & Basic Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveInlineName();
                          } else if (e.key === "Escape") {
                            handleCancelInlineName();
                          }
                        }}
                        autoFocus
                        disabled={isSavingName}
                        className="text-lg sm:text-2xl font-bold text-white bg-slate-950/90 border border-indigo-500 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                        placeholder="Enter full name"
                      />
                      <button
                        type="button"
                        onClick={handleSaveInlineName}
                        disabled={isSavingName}
                        className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                        title="Save name (Enter)"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelInlineName}
                        disabled={isSavingName}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Cancel (Esc)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-2">
                      <h1
                        onClick={() => {
                          setTempName(name);
                          setIsEditingName(true);
                        }}
                        className="text-xl sm:text-2xl font-bold text-white tracking-tight cursor-pointer hover:text-indigo-200 transition"
                        title="Click to edit name"
                      >
                        {name}
                      </h1>
                      <button
                        type="button"
                        onClick={() => {
                          setTempName(name);
                          setIsEditingName(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition opacity-80 group-hover:opacity-100 cursor-pointer"
                        title="Edit name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{email}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{savedProfile.memberSince || formatMemberSince(authUser?.createdAt || currentUser.createdAt)}</span>
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
            onClick={() => handleTabChange("workspaces")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === "workspaces"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Workspaces ({workspaces.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("subscription")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === "subscription"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Subscription & Plans</span>
          </button>

          <button
            onClick={() => handleTabChange("tasks")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === "tasks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My Tasks ({userTasks.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("preferences")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === "preferences"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => handleTabChange("security")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* Tab Content Panels (min-h prevents layout shift/jump) */}
        <div className="min-h-125">
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
                          onClick={() => handleSelectPlan("basic")}
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
                            onClick={() => handleSelectBillingCycle("monthly")}
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
                            onClick={() => handleSelectBillingCycle("yearly")}
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
                          disabled
                          className="w-full shadow-xl shadow-indigo-950/60"
                          icon={<Sparkles className="w-4 h-4" />}
                          onClick={() => handleSelectPlan("pro", billingCycle)}
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
                      <span>{ws.boardCount} {ws.boardCount === 1 ? 'board' : 'boards'}</span>
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
                  isLoading={isUpdatingPassword}
                  disabled={isUpdatingPassword}
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>


            {/* Active Sessions */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
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
                  disabled={otherSessionsCount === 0}
                  onClick={handleRevokeOtherSessions}
                  className={otherSessionsCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {otherSessionsCount > 0
                    ? `Revoke Other Sessions (${otherSessionsCount})`
                    : "No Other Sessions"}
                </Button>
              </div>

              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs transition-all hover:border-slate-700/80"
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
                      <span className="text-[11px] font-medium text-emerald-400 inline-flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Active Now</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLogoutSession(session.id, session.device)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        </div>
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
