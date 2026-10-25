import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  showArrow?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, href, variant = 'primary', className, showArrow = false, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg shadow-indigo-600/20',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
    ghost: 'text-slate-700 hover:text-indigo-600 focus:ring-indigo-500',
  };
  const classes = cn(base, variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {showArrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
      {showArrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </button>
  );
}