import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

export interface NudgeCardProps {
  id: string;
  courseId: string;
  courseName: string;
  nudgeType: 'range_entry' | 'range_stuck' | 'inactivity' | 'goal_behind';
  message: string;
  generatedAt: string;
  onDismiss: (id: string) => void;
  onOpenCourse: (id: string, courseId: string) => void;
  onRemindLater: (id: string) => void;
}

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    
    if (isNaN(diffMs)) return 'Recently';

    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
    }
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
};

export const NudgeCard: React.FC<NudgeCardProps> = ({
  id,
  courseId,
  courseName,
  nudgeType,
  message,
  generatedAt,
  onDismiss,
  onOpenCourse,
  onRemindLater,
}) => {
  // Configs for type pills
  const typePillConfig = {
    range_entry: { label: '📈 Progress', color: '#7B9EA8' },
    range_stuck: { label: '⏸ Stuck', color: '#E8A87C' },
    inactivity: { label: '💤 Inactive', color: '#8B949E' },
    goal_behind: { label: '🎯 Goal', color: '#E8A87C' },
  };

  const pill = typePillConfig[nudgeType] || { label: 'Nudge', color: '#8B949E' };

  const cardVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } },
    exit: { opacity: 0, x: 300, transition: { duration: 0.25, ease: 'easeIn' as const } },
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] dark:border-[var(--border-dark)] border-l-3 border-l-[#E8A87C] rounded-[10px] p-4 mb-3 shadow-sm hover:shadow-md transition-shadow relative flex flex-col gap-2.5 text-left"
      style={{ borderLeftWidth: '3px', borderLeftColor: '#E8A87C' }}
    >
      {/* Top Row: Course name & dismiss */}
      <div className="flex justify-between items-start gap-4">
        <span className="text-[11px] font-bold font-sans uppercase tracking-wider text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] truncate max-w-[85%]">
          {courseName}
        </span>
        <button
          onClick={() => onDismiss(id)}
          className="text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-darkPri)] p-0.5 rounded transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      {/* Type Pill */}
      <div className="flex">
        <span
          className="text-[10px] font-bold font-sans px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: pill.color }}
        >
          {pill.label}
        </span>
      </div>

      {/* Message */}
      <p className="text-[14px] font-sans text-[var(--text-primary)] dark:text-[var(--text-darkPri)] leading-normal line-clamp-4 font-normal">
        {message}
      </p>

      {/* Buttons Row */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onOpenCourse(id, courseId)}
          className="flex-1 py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 text-white bg-[var(--accent-primary)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ExternalLink size={13} />
          Open Course
        </button>
        <button
          onClick={() => onRemindLater(id)}
          className="py-1.5 px-3 rounded-lg text-[12px] font-semibold text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-darkPri)] hover:bg-black/5 dark:hover:bg-white/5 border border-[var(--border-light)] dark:border-[var(--border-dark)] transition-colors cursor-pointer"
        >
          Remind later
        </button>
      </div>

      {/* Timestamp */}
      <div className="text-[11px] font-sans text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] mt-0.5">
        {formatRelativeTime(generatedAt)}
      </div>
    </motion.div>
  );
};
