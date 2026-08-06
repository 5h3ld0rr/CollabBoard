import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  ShieldCheck,
  WifiOff,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AmbientBackground, BackButton, Button, Logo } from "../components/common";

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);

    // Simulate authentication flow (M1 static flow)
    setTimeout(() => {
      setIsLoading(false);
      navigate("/boards");
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glow effects */}
      <AmbientBackground variant="auth" />

      {/* Back to Home Button */}
      <div className="w-full max-w-5xl mb-4 sm:mb-6 flex items-center justify-start">
        <BackButton to="/" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 px-4 lg:px-0">
          <Logo size="lg" />

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back to <br />
              <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                your team's canvas.
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Pick up right where you left off. Jump back into live collaboration,
              active sprints, and shared workspaces.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 text-slate-300 text-sm">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-200">
                  Sub-millisecond State Sync
                </p>
                <p className="text-slate-400 text-xs">
                  Instant board reflections across your distributed team.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300 text-sm">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-200">
                  Enterprise-grade Security
                </p>
                <p className="text-slate-400 text-xs">
                  Encrypted sessions, RBAC permissioning, and audit logging.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300 text-sm">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-200">
                  Seamless Offline Recovery
                </p>
                <p className="text-slate-400 text-xs">
                  Work uninterrupted even when connectivity drops.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your credentials below to access your boards.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    required
                    className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Password reset functionality will be available in milestone 2.");
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 transition"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-xs text-slate-400 cursor-pointer select-none"
                  >
                    Remember me on this device
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                variant="primary"
                size="md"
                className="w-full mt-2"
                iconRight={<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              >
                Sign In
              </Button>
            </form>

            {/* Switch to Register */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition inline-flex items-center space-x-1"
                >
                  <span>Sign up</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
