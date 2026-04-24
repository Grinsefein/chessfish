import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AccuracyGaugeProps {
  accuracy: number;
  className?: string;
  size?: number;
}

export const AccuracyGauge: React.FC<AccuracyGaugeProps> = ({
  accuracy,
  className,
  size = 160
}) => {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (accuracy / 100) * circumference;

  const getAccuracyColor = (val: number) => {
    if (val >= 90) return '#10b981'; // emerald-500
    if (val >= 75) return '#3b82f6'; // blue-500
    if (val >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
        />
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getAccuracyColor(accuracy)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>

      {/* Accuracy Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-black text-white tracking-tighter"
        >
          {Math.round(accuracy)}%
        </motion.span>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] -mt-1">
          Accuracy
        </span>
      </div>
    </div>
  );
};
