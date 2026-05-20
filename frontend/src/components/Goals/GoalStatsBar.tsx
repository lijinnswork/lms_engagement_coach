import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  React.useEffect(() => {
    const animation = animate(count, value, { duration: 0.4 });
    return animation.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

export interface GoalStats {
  active_count: number;
  completed_count: number;
  proposed_count: number;
  next_deadline: string | null;
}

interface GoalStatsBarProps {
  stats: GoalStats | null;
}

export const GoalStatsBar: React.FC<GoalStatsBarProps> = ({ stats }) => {
  if (!stats) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const hasNextDeadline = !!stats.next_deadline;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 w-full">
      {/* Active Goals */}
      <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col justify-center border-l-[3px] border-l-accent-primary shadow-sm">
        <div className="font-mono text-[24px] font-bold text-text-primary dark:text-text-darkPri leading-none mb-1">
          <AnimatedCounter value={stats.active_count} />
        </div>
        <div className="font-sans text-[12px] text-text-secondary dark:text-text-darkSec font-medium">
          Active Goals
        </div>
      </div>

      {/* Completed Goals */}
      <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col justify-center border-l-[3px] border-l-accent-soft shadow-sm">
        <div className="font-mono text-[24px] font-bold text-text-primary dark:text-text-darkPri leading-none mb-1">
          <AnimatedCounter value={stats.completed_count} />
        </div>
        <div className="font-sans text-[12px] text-text-secondary dark:text-text-darkSec font-medium">
          Completed Goals
        </div>
      </div>

      {/* Suggested by Coach */}
      <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col justify-center border-l-[3px] border-l-accent-warm shadow-sm">
        <div className={`font-mono text-[24px] font-bold leading-none mb-1 ${stats.proposed_count > 0 ? 'text-accent-warm animate-pulse' : 'text-text-primary dark:text-text-darkPri'}`}>
          <AnimatedCounter value={stats.proposed_count} />
        </div>
        <div className="font-sans text-[12px] text-text-secondary dark:text-text-darkSec font-medium">
          Suggested by Coach
        </div>
      </div>

      {/* Next Deadline */}
      <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col justify-center border-l-[3px] border-l-text-tertiary dark:border-l-text-darkSec shadow-sm">
        <div className="font-mono text-[20px] font-bold text-text-primary dark:text-text-darkPri leading-none mb-1 mt-0.5">
          {formatDate(stats.next_deadline)}
        </div>
        <div className="font-sans text-[12px] text-text-secondary dark:text-text-darkSec font-medium">
          {hasNextDeadline ? 'Next Deadline' : 'No deadlines'}
        </div>
      </div>
    </div>
  );
};
