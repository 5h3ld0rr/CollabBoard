import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Zap,
  WifiOff,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AmbientBackground, BackButton, Button, Logo } from "../components/common";

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Password strength checks
  const hasMinLength = formData.password.length >= 8;
  const hasNumberOrSpecial = /[0-9!@#$%^&*]/.test(formData.password);
  const hasMixedCase =
    /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password);
  const passwordsMatch =
    formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter a valid email address");
      return;
    }
    if (!hasMinLength) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.agreeTerms) {
      setError("Please accept the Terms of Service & Privacy Policy");
      return;
    }

    setIsLoading(true);

    // Simulate registration (M1 static flow)
    setTimeout(() => {
      setIsLoading(false);
      navigate("/login");
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
              Real-time collaboration, <br />
              <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                seamless anywhere.
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Supercharge your team's workflow with instant board
              synchronization, offline resilience, and fluid task management.
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
                  Instant Real-time Sync
                </p>
                <p className="text-slate-400 text-xs">
                  Live updates powered by WebSockets with conflict resolution.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300 text-sm">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-200">
                  Offline-First Resilience
                </p>
                <p className="text-slate-400 text-xs">
                  Keep working without internet; changes sync automatically when
                  back online.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300 text-sm">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-200">Team Workspaces</p>
                <p className="text-slate-400 text-xs">
                  Organize multiple Kanban boards with granular member
                  assignments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Get started with your free collaborative board in seconds.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                    className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

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

              {/* Password Fields (Grid on Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-slate-950/60 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                        formData.confirmPassword && !passwordsMatch
                          ? "border-red-500/60 focus:ring-red-500/50 focus:border-red-500"
                          : "border-slate-700/60 focus:ring-indigo-500/50 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength checklist */}
              {formData.password && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${hasMinLength ? "text-emerald-400" : "text-slate-600"}`}
                    />
                    <span
                      className={
                        hasMinLength ? "text-slate-200" : "text-slate-500"
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${hasMixedCase ? "text-emerald-400" : "text-slate-600"}`}
                    />
                    <span
                      className={
                        hasMixedCase ? "text-slate-200" : "text-slate-500"
                      }
                    >
                      Mixed uppercase & lowercase letters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${hasNumberOrSpecial ? "text-emerald-400" : "text-slate-600"}`}
                    />
                    <span
                      className={
                        hasNumberOrSpecial ? "text-slate-200" : "text-slate-500"
                      }
                    >
                      Contains number or special symbol
                    </span>
                  </div>
                </div>
              )}

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start space-x-3 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 transition"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <span className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Privacy Policy
                  </span>
                  .
                </label>
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
                Create Account
              </Button>
            </form>

            {/* Switch to Login */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition inline-flex items-center space-x-1"
                >
                  <span>Sign in</span>
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

export default Register;
