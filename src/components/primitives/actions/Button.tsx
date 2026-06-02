import type React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/ui/cn';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'icon';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-violet-600 text-white shadow-sm hover:bg-violet-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  danger: 'border border-red-100 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-slate-700 hover:bg-slate-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'rounded-xl px-3 py-2 text-sm',
  md: 'rounded-2xl px-4 py-2 text-sm',
  icon: 'h-10 w-10 rounded-xl p-0',
};

export function Button({ variant = 'secondary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ variant = 'secondary', size = 'md', className, children, ...props }: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
