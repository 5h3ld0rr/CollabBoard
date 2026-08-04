import React from "react";

export interface AmbientBackgroundProps {
  variant?: "default" | "auth" | "minimal";
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  variant = "default",
  className = "",
}) => {
  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {variant === "default" && (
        <>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-175 h-112.5 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </>
      )}

      {variant === "auth" && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        </>
      )}

      {variant === "minimal" && (
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      )}
    </div>
  );
};

export default AmbientBackground;
