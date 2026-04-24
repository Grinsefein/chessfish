import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { MoveClassification } from '@/store/gameStore';
import {
  Sparkles,
  Zap,
  Star,
  ThumbsUp,
  Info,
  AlertCircle,
  XCircle,
  Trophy,
  BookOpen
} from 'lucide-react';

interface ClassificationBadgeProps {
  classification: MoveClassification;
  className?: string;
}

const CLASSIFICATION_CONFIG: Record<MoveClassification, {
  icon: React.ElementType;
  color: string;
  shadow: string;
  label: string;
}> = {
  brilliant: {
    icon: Sparkles,
    color: 'bg-teal-500',
    shadow: 'shadow-[0_4px_0_0_#0d9488] shadow-teal-500/20',
    label: '!!'
  },
  great: {
    icon: Zap,
    color: 'bg-blue-600',
    shadow: 'shadow-[0_4px_0_0_#1e3a8a]',
    label: '!'
  },
  best: {
    icon: Star,
    color: 'bg-green-600',
    shadow: 'shadow-[0_4px_0_0_#14532d]',
    label: '★'
  },
  excellent: {
    icon: ThumbsUp,
    color: 'bg-green-500',
    shadow: 'shadow-[0_4px_0_0_#166534]',
    label: '!'
  },
  good: {
    icon: ThumbsUp,
    color: 'bg-zinc-500',
    shadow: 'shadow-[0_4px_0_0_#3f3f46]',
    label: ''
  },
  inaccuracy: {
    icon: Info,
    color: 'bg-yellow-500',
    shadow: 'shadow-[0_4px_0_0_#a16207]',
    label: '?!'
  },
  mistake: {
    icon: AlertCircle,
    color: 'bg-orange-500',
    shadow: 'shadow-[0_4px_0_0_#9a3412]',
    label: '?'
  },
  blunder: {
    icon: XCircle,
    color: 'bg-red-600',
    shadow: 'shadow-[0_4px_0_0_#7f1d1d]',
    label: '??'
  },
  missed_win: {
    icon: Trophy,
    color: 'bg-purple-600',
    shadow: 'shadow-[0_4px_0_0_#581c87]',
    label: '-+'
  },
  book: {
    icon: BookOpen,
    color: 'bg-amber-700',
    shadow: 'shadow-[0_4px_0_0_#451a03]',
    label: ''
  },
};

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  className
}) => {
  const config = CLASSIFICATION_CONFIG[classification];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={classification}
        initial={{ scale: 0, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          "absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-50",
          "w-6 h-6 rounded-full flex items-center justify-center border-2 border-white/20",
          config.color,
          config.shadow,
          className
        )}
      >
        <Icon size={12} className="text-white fill-white/20" />
        {config.label && (
          <span className="absolute -top-1 -right-1 text-[8px] font-black text-white drop-shadow-md">
            {config.label}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
