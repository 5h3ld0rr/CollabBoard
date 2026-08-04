import React from "react";
import { Link } from "react-router-dom";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonProps = ButtonBaseProps &
  (
    | (React.ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined; href?: undefined })
    | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: undefined })
    | ({ to: string; href?: undefined; onClick?: () => void; disabled?: boolean; target?: string; rel?: string })
  );

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 focus:ring-indigo-500 focus:ring-offset-slate-900",
  secondary:
    "bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white shadow-sm focus:ring-slate-500 focus:ring-offset-slate-900",
  outline:
    "bg-transparent hover:bg-slate-800/60 border border-slate-700 text-slate-300 hover:text-white focus:ring-slate-500 focus:ring-offset-slate-900",
  ghost:
    "bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white focus:ring-slate-500 focus:ring-offset-slate-900",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs font-semibold rounded-lg",
  md: "px-5 py-2.5 text-sm font-semibold rounded-xl",
  lg: "px-8 py-3.5 text-base font-semibold rounded-xl",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  iconRight,
  className = "",
  children,
  disabled,
  ...rest
}) => {
  const baseClasses = `inline-flex items-center justify-center space-x-2 font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none group select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const content = (
    <>
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </>
  );

  if ("to" in rest && rest.to) {
    const { to, ...linkProps } = rest as { to: string; [key: string]: any };
    return (
      <Link to={to} className={baseClasses} {...linkProps}>
        {content}
      </Link>
    );
  }

  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest as { href: string; [key: string]: any };
    return (
      <a href={href} className={baseClasses} {...anchorProps}>
        {content}
      </a>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={buttonProps.type || "button"}
      disabled={disabled || isLoading}
      className={baseClasses}
      {...buttonProps}
    >
      {content}
    </button>
  );
};

export default Button;
