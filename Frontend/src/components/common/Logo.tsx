import React from "react";
import { Kanban } from "lucide-react";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    box: "w-8 h-8 rounded-lg",
    icon: "w-4 h-4",
    text: "text-lg",
  },
  md: {
    box: "w-10 h-10 rounded-xl",
    icon: "w-5 h-5",
    text: "text-xl",
  },
  lg: {
    box: "w-12 h-12 rounded-xl",
    icon: "w-6 h-6",
    text: "text-2xl",
  },
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const config = sizeConfig[size];

  const content = (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <div
        className={`${config.box} bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform`}
      >
        <Kanban className={`${config.icon} text-white`} />
      </div>
      {showText && (
        <span
          className={`${config.text} font-bold tracking-tight bg-linear-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent`}
        >
          CollabBoard
        </span>
      )}
    </div>
  );


  return content;
};

export default Logo;
