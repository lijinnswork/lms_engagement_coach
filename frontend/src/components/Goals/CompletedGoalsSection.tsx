import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, MoreVertical, Trash2, Calendar } from 'lucide-react';

export const CompletedGoalsSection = ({ goals, onUpdateStatus, onDelete }: any) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (goals.length === 0) {
    return (
      <div className="py-8 text-center bg-bg-secondary/50 dark:bg-bg-darkCard/50 rounded-xl border border-border-light dark:border-border-dark border-dashed">
        <p className="text-[14px] text-text-secondary dark:text-text-darkSec">
          No completed goals yet — your first win is coming! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {goals.map((goal: any) => (
        <div key={goal.id} className="w-full flex items-center justify-between p-4 bg-accent-soft/5 border-l-[3px] border-l-accent-soft rounded-r-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-accent-soft shrink-0" />
            <div>
              <h4 className="font-sans text-[15px] text-text-primary dark:text-text-darkPri">
                {goal.title}
              </h4>
              <p className="text-[12px] text-text-secondary dark:text-text-darkSec mt-0.5 flex items-center gap-1.5">
                {goal.course_id ? 'Course Goal' : 'General Goal'}
                <span>·</span>
                <Calendar size={12} className="inline opacity-70" />
                Completed {formatDate(goal.updated_at)}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === goal.id ? null : goal.id); }}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpenId === goal.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark shadow-xl rounded-lg py-1 z-20">
                  <button 
                    onClick={() => { setMenuOpenId(null); onUpdateStatus(goal.id, 'active'); }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-secondary flex items-center gap-2 text-text-primary"
                  >
                    Mark active
                  </button>
                  <button 
                    onClick={() => {
                      setMenuOpenId(null);
                      if (window.confirm("Permanently delete this goal?")) {
                        onDelete(goal.id);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-secondary flex items-center gap-2 text-[#D4856A]"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
