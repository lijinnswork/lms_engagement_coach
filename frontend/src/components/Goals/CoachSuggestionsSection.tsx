import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, Edit2, X } from 'lucide-react';
import { GentleButton } from '../Common/GentleButton';

export const CoachSuggestionsSection = ({ suggestions, onApprove, onEdit, onDismiss }: any) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section className="mb-10 w-full">
      <h2 className="text-[14px] uppercase tracking-wider text-accent-warm font-bold mb-1">
        ✨ Suggested by your coach
      </h2>
      <p className="text-[13px] text-text-secondary dark:text-text-darkSec mb-4">
        Your coach has {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}:
      </p>
      
      <div className="flex flex-col gap-3 w-full">
        <AnimatePresence>
          {suggestions.slice(0, 3).map((goal: any) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full bg-accent-warm/5 border-l-[3px] border-l-accent-warm rounded-r-lg p-5 flex flex-col"
            >
              <div className="flex gap-3 items-start">
                <Target size={20} className="text-accent-warm mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-sans font-bold text-[16px] text-text-primary dark:text-text-darkPri">
                    {goal.title}
                  </h3>
                  <p className="text-[14px] text-text-secondary dark:text-text-darkSec mt-1">
                    {goal.course_id ? 'Course Goal' : 'General Goal'}
                  </p>
                  {goal.description && (
                    <p className="font-serif italic text-[14px] text-text-secondary dark:text-text-darkSec mt-3 pl-3 border-l-2 border-accent-warm/30">
                      "{goal.description}"
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-4 pt-3 border-t border-accent-warm/10">
                    <GentleButton 
                      onClick={() => onApprove(goal.id)}
                      className="!bg-accent-primary !text-white hover:!bg-accent-primary/90"
                    >
                      <Check size={14} className="inline mr-1" /> Approve
                    </GentleButton>
                    <GentleButton 
                      variant="secondary" 
                      onClick={() => onEdit(goal)}
                    >
                      <Edit2 size={14} className="inline mr-1" /> Edit & Approve
                    </GentleButton>
                    <div className="flex-1" />
                    <button 
                      onClick={() => {
                        if (window.confirm("Dismiss this suggestion? Your coach won't suggest this specific goal again.")) {
                          onDismiss(goal.id);
                        }
                      }}
                      className="p-2 text-text-secondary hover:text-[#D4856A] hover:bg-[#D4856A]/10 rounded-full transition-colors"
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {suggestions.length > 3 && (
          <p className="text-[13px] text-text-tertiary ml-2 italic">
            and {suggestions.length - 3} more...
          </p>
        )}
      </div>
    </section>
  );
};
