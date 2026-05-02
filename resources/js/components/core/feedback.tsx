import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variants = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-900',
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-900',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-100',
    text: 'text-yellow-900',
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    text: 'text-red-900',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
};

export const Alert = ({ variant = 'info', title, children, onClose, className }: AlertProps) => {
  const style = variants[variant];

  return (
    <div className={cn('flex gap-3 p-4 rounded-2xl border', style.bg, style.border, style.text, className)}>
      <div className="shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold leading-none">{title}</h5>}
        <div className="text-sm opacity-80 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 hover:opacity-60 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const Progress = ({ value, max = 100, className, barColor = 'bg-yellow-400' }: { value: number; max?: number; className?: string; barColor?: string }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('h-2 w-full bg-yellow-100 rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className={cn('h-full', barColor)}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
};

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-yellow-100 rounded-xl', className)} />
);
