import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const ProgressHero = ({ data }: { data: any }) => {
  const [fillPct, setFillPct] = useState(0);

  useEffect(() => {
    // Animate to the actual progress
    setTimeout(() => {
      setFillPct(data.progress_percent || 0);
    }, 100);
  }, [data.progress_percent]);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (fillPct / 100) * circumference;

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col gap-6">
      
      <div className="flex items-center gap-6 md:flex-row flex-col md:items-center items-start">
        {/* Progress Ring */}
        <div className="relative w-[100px] h-[100px] shrink-0 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--border-light)"
              strokeWidth="8"
              fill="transparent"
              className="dark:stroke-border-dark"
            />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--accent-primary, #7B9EA8)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[24px] font-bold text-text-primary dark:text-text-darkPri">
              {Math.round(fillPct)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2">
          <div className="font-sans text-[16px] text-text-primary dark:text-text-darkPri">
            <span className="font-bold">{data.items_completed}</span> of <span className="font-bold">{data.total_items}</span> items completed
          </div>
          <div className="font-sans text-[14px] text-text-secondary">
            Last active: {formatLastActive(data.last_activity_time)}
          </div>
          <div className="font-sans text-[14px] text-text-secondary flex items-center gap-1.5">
            Enrolled: 
            {data.enrollment_active ? (
              <span className="text-[#34D399] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34D399]"></span> Active
              </span>
            ) : (
              <span className="text-text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-border-light dark:bg-border-dark"></span> Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          />
        </div>
        <span className="text-[12px] font-medium text-text-secondary font-mono">{Math.round(fillPct)}%</span>
      </div>

    </div>
  );
};
