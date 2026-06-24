'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { cn, formatCompact, formatCurrency } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
  className?: string;
}

export function ScoreGauge({ score, label, size = 160, className }: ScoreGaugeProps) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const color = score >= 75 ? '#00E5A0' : score >= 50 ? '#1A1AFF' : score >= 25 ? '#FFB800' : '#FF4D6D';

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)} style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(37,37,58,1)"
          strokeWidth={10}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        {label && <span className="text-[10px] text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  );
}

interface SparkProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline({ data, color = '#1A1AFF', height = 40, className }: SparkProps) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = 100 / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => `${i * step},${100 - ((v - min) / range) * 100}`).join(' ');
  const area = `${points} 100,100 0,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('w-full', className)} style={{ height }}>
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface MiniMetricProps {
  label: string;
  value: number | string;
  delta?: number;
  prefix?: string;
  suffix?: string;
  format?: 'currency' | 'number' | 'percent';
}

export function MiniMetric({ label, value, delta, format = 'number' }: MiniMetricProps) {
  const display = typeof value === 'string' ? value
    : format === 'currency' ? formatCurrency(value)
    : format === 'compact' ? formatCompact(value)
    : value.toLocaleString('pt-BR');

  const positive = (delta ?? 0) > 0;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold">{display}</span>
        {delta !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-[11px] font-medium', positive ? 'text-success' : 'text-destructive')}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function AIBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/20 to-success/20 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/30">
      <Sparkles className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}