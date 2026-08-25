import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to = "/",
  label = "Back to Home",
  className = "",
}) => {
  return (
    <Link
      to={to}
      className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-400 hover:text-white text-xs sm:text-sm font-medium border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-md transition-all duration-200 group shadow-sm ring-1 ring-white/5 cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-all" />
      <span>{label}</span>
    </Link>
  );
};

export default BackButton;
