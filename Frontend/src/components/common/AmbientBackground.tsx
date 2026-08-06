import React from "react";

export interface AmbientBackgroundProps {
  variant?: "default" | "auth" | "minimal";
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({
  variant = "default",
  className = "",
}) => {
  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 contain-strict ${className}`}
      aria-hidden="true"
    >
      {variant === "default" && (
        <>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-175 h-112.5 bg-indigo-600/12 rounded-full blur-[100px] transform-gpu pointer-events-none" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-600/8 rounded-full blur-[90px] transform-gpu pointer-events-none" />
          <div className="absolute bottom-10 -right-40 w-96 h-96 bg-blue-600/8 rounded-full blur-[90px] transform-gpu pointer-events-none" />
        </>
      )}

      {variant === "auth" && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[90px] transform-gpu pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[90px] transform-gpu pointer-events-none" />
        </>
      )}

      {variant === "minimal" && (
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-96 bg-indigo-600/8 rounded-full blur-[100px] transform-gpu pointer-events-none" />
      )}
    </div>
  );
});

export default AmbientBackground;
