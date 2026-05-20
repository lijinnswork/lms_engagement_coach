import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AboutCourse = ({ data }: { data: any }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden mb-8">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-text-primary dark:text-text-darkPri hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={18} />
          <span className="font-serif text-[16px] font-medium">About This Course</span>
        </div>
        <div className="flex items-center gap-1 text-[13px] text-text-secondary">
          {expanded ? 'Collapse' : 'Expand'}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 overflow-hidden"
          >
            <div className="pt-2 flex flex-col gap-2">
              <div className="text-[14px] text-text-secondary flex gap-2">
                <span className="w-24 shrink-0 font-medium text-text-primary dark:text-text-darkPri">Course:</span>
                <span>{data.course_name}</span>
              </div>
              <div className="text-[14px] text-text-secondary flex gap-2">
                <span className="w-24 shrink-0 font-medium text-text-primary dark:text-text-darkPri">Course ID:</span>
                <span className="font-mono text-[13px]">{data.course_id}</span>
              </div>
              <div className="text-[14px] text-text-secondary flex gap-2">
                <span className="w-24 shrink-0 font-medium text-text-primary dark:text-text-darkPri">Total items:</span>
                <span>{data.total_items}</span>
              </div>
              <div className="text-[14px] text-text-secondary flex gap-2">
                <span className="w-24 shrink-0 font-medium text-text-primary dark:text-text-darkPri">Enrollment:</span>
                <span>{data.enrollment_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
