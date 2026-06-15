import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from './NudgeCard';

export interface FloatingNudgeCardProps {
  id: string;
  courseId: string;
  courseName: string;
  nudgeType: 'range_entry' | 'range_stuck' | 'inactivity' | 'goal_behind';
  message: string;
  generatedAt: string;
  index: number;
  onDismiss: (id: string) => void;
  onOpenCourse: (id: string, courseId: string) => void;
  onRemindLater: (id: string) => void;
}

export const FloatingNudgeCard: React.FC<FloatingNudgeCardProps> = ({
  id,
  courseId,
  courseName,
  nudgeType,
  message,
  generatedAt,
  index,
  onDismiss,
  onOpenCourse,
  onRemindLater,
}) => {
  const typePillConfig = {
    range_entry: { label: '📈 Progress', color: '#7B9EA8' },
    range_stuck: { label: '⏸ Stuck', color: '#E8A87C' },
    inactivity: { label: '💤 Inactive', color: '#8B949E' },
    goal_behind: { label: '🎯 Goal', color: '#E8A87C' },
  };

  const pill = typePillConfig[nudgeType] || { label: 'Nudge', color: '#8B949E' };
  
  // Calculate stagger delay: 150ms per item
  const staggerDelay = index * 0.15;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 320 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 320 }}
      transition={{ 
        x: { type: 'spring', damping: 22, stiffness: 180, delay: staggerDelay },
        opacity: { duration: 0.2, delay: staggerDelay }
      }}
      className="w-[280px] bg-[var(--bg-primary)] border border-[var(--border-light)] dark:border-[var(--border-dark)] border-l-3 border-l-[#E8A87C] rounded-[10px] p-3.5 shadow-lg relative flex flex-col gap-2 text-left pointer-events-auto"
      style={{ borderLeftWidth: '3px', borderLeftColor: '#E8A87C' }}
    >
      {/* Top Row: Course name & dismiss */}
      <div className="flex justify-between items-start gap-3">
        <span className="text-[11px] font-bold font-sans uppercase tracking-wider text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] truncate max-w-[80%]">
          {courseName}
        </span>
        <button
          onClick={() => onDismiss(id)}
          className="text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-darkPri)] p-0.5 rounded transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Type Pill */}
      <div className="flex">
        <span
          className="text-[9px] font-bold font-sans px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: pill.color }}
        >
          {pill.label}
        </span>
      </div>

      {/* Message */}
      <p className="text-[13px] font-sans text-[var(--text-primary)] dark:text-[var(--text-darkPri)] leading-normal line-clamp-4 font-normal">
        {message}
      </p>

      {/* Buttons Row */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onOpenCourse(id, courseId)}
          className="flex-1 py-1 px-2.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 text-white bg-[var(--accent-primary)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ExternalLink size={12} />
          Open
        </button>
        <button
          onClick={() => onRemindLater(id)}
          className="py-1 px-2.5 rounded-md text-[11px] font-semibold text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-darkPri)] hover:bg-black/5 dark:hover:bg-white/5 border border-[var(--border-light)] dark:border-[var(--border-dark)] transition-colors cursor-pointer"
        >
          Later
        </button>
      </div>

      {/* Timestamp */}
      <div className="text-[10px] font-sans text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] opacity-85">
        {formatRelativeTime(generatedAt)}
      </div>
    </motion.div>
  );
};
