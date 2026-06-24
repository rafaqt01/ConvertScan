'use client';

import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  hint?: string;
  format?: 'currency' | 'number' | 'percent' | 'text';
  delay?: number;
}

export function StatCard({ label, value, change, icon: Icon, hint, delay = 0 }: StatCardProps) {
  const positive = (change ?? 0) > 0;
  const negative = (change ?? 0) < 0;
  const TrendIcon = positive ? ArrowUp : negative ? ArrowDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 card-hover"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {change !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
              positive && 'bg-success/15 text-success',
              negative && 'bg-destructive/15 text-destructive',
              !positive && !negative && 'bg-muted text-muted-foreground'
            )}>
              <TrendIcon className="h-3 w-3" />
              {formatPercent(Math.abs(change) / 100, 1)}
            </span>
          )}
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
      </div>
    </motion.div>
  );
}