import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, Calendar, BellRing } from 'lucide-react';

import { useRemindersStore } from '../../store/useRemindersStore';

const AssessmentItem: React.FC<{ item: any; isOverdue: boolean }> = ({ item, isOverdue }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex items-center gap-4 p-4 rounded-[12px] border ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-[var(--bg-surface)] border-[var(--border-light)] dark:border-[var(--border-dark)] hover:border-[var(--coach-primary)]/50'} transition-all cursor-pointer`}
      onClick={() => window.open('#', '_blank')}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isOverdue ? <AlertCircle size={16} className="text-red-500" /> : <FileText size={16} className="text-[var(--text-secondary)]" />}
          <h3 className={`text-[15px] font-semibold truncate ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-[var(--text-primary)]'}`}>
            {item.name}
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-500' : ''}`}>
            {item.status}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="truncate">
            {item.course_name}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const AssessmentReminders: React.FC = () => {
  const { assessments } = useRemindersStore();

  const sections = [
    { key: 'overdue', label: 'Overdue Assessments', icon: <AlertCircle size={16} className="text-red-500" />, items: assessments.overdue, isOverdue: true },
    { key: 'today', label: 'Assessments Due Today', icon: <BellRing size={16} />, items: assessments.today, isOverdue: false },
    { key: 'tomorrow', label: 'Assessments Due Tomorrow', icon: <Calendar size={16} />, items: assessments.tomorrow, isOverdue: false },
    { key: 'this_week', label: 'Assessments Due This Week', icon: <Calendar size={16} />, items: assessments.this_week, isOverdue: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-dashed border-[var(--border-light)] dark:border-[var(--border-dark)] items-start">
      {sections.map(({ key, label, icon, items, isOverdue }) => {
        if (items.length === 0) return null;

        return (
          <div key={key} className="space-y-3 w-full">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider">
              {icon}
              <h3 className={isOverdue ? 'text-red-500' : ''}>{label}</h3>
              <span className="text-[10px] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              {items.map((item) => (
                <AssessmentItem key={item.id} item={item} isOverdue={isOverdue} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
