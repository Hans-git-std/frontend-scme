import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Activity, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingAnimationProps {
  message?: string;
  subMessage?: string;
  variant?: 'card' | 'fullscreen' | 'compact' | 'pulse';
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Connecting with secure cloud server...',
  'Processing multi-domain academic records...',
  'Evaluating skill-weighted compatibility matrix...',
  'Syncing live verification audit ledger...',
  'Almost ready...',
];

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = 'Loading data...',
  subMessage,
  variant = 'card',
  className,
}) => {
  const [activeMsgIndex, setActiveMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const displayMessage = subMessage || DEFAULT_MESSAGES[activeMsgIndex];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-800/40 text-xs text-brand-700 dark:text-brand-300 animate-in fade-in', className)}>
        <div className="relative flex items-center justify-center w-5 h-5">
          <div className="w-5 h-5 rounded-full border-2 border-brand-500/30 border-t-brand-600 animate-spin" />
          <Zap className="w-2.5 h-2.5 text-brand-500 absolute animate-pulse" />
        </div>
        <span className="font-medium animate-pulse">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-5 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300',
        variant === 'fullscreen' && 'min-h-[60vh]',
        className
      )}
    >
      {/* Animated Glowing Orbital Rings */}
      <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-500/30 via-sky-400/20 to-indigo-500/30 blur-xl animate-pulse" />

        {/* Orbit Ring 1 */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/40 animate-[spin_8s_linear_infinite]" />

        {/* Orbit Ring 2 */}
        <div className="absolute inset-1.5 rounded-full border-2 border-t-brand-600 border-r-transparent border-b-sky-400 border-l-transparent animate-[spin_2.5s_cubic-bezier(0.4,0,0.2,1)_infinite]" />

        {/* Center Orb */}
        <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 animate-bounce duration-1000">
          <Sparkles className="w-5 h-5 animate-spin duration-3000" />
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          {message}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 transition-opacity duration-300 font-medium">
          {displayMessage}
        </p>
      </div>

      {/* Shimmering Linear Progress Bar */}
      <div className="w-48 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500 to-transparent w-full animate-[shimmer_1.8s_infinite] -translate-x-full" />
      </div>
    </div>
  );
};
