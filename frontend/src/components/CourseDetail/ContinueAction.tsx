import React from 'react';
import { ArrowRight } from 'lucide-react';

export const ContinueAction = ({ data }: { data: any }) => {
  const itemsRemaining = Math.max(0, (data.total_items || 0) - (data.items_completed || 0));
  const isComplete = itemsRemaining === 0 && data.total_items > 0;

  const handleContinue = () => {
    const LMS_URL = import.meta.env.VITE_LMS_URL || 'https://iimbx.edu.in';
    window.open(`${LMS_URL}/courses/${data.course_id}/course/`, '_blank');
  };

  const getRemainingText = () => {
    if (isComplete) return "🎉 You've completed all items in this course!";
    if (itemsRemaining === 1) return "You have 1 item remaining — almost there!";
    if (itemsRemaining <= 3) return `You're so close — just ${itemsRemaining} items to go!`;
    return `You have ${itemsRemaining} items remaining in this course.`;
  };

  return (
    <div 
      className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
      style={{
        backgroundColor: 'rgba(123, 158, 168, 0.05)', // --accent-primary at 5%
        borderLeft: '3px solid var(--accent-primary, #7B9EA8)'
      }}
    >
      <div className="flex flex-col gap-1">
        {!isComplete && (
          <h3 className="text-[16px] font-serif text-text-primary dark:text-text-darkPri">
            Ready to pick up where you left off?
          </h3>
        )}
        <p className="text-[14px] text-text-secondary">
          {getRemainingText()}
        </p>
      </div>

      {!isComplete && (
        <button 
          onClick={handleContinue}
          className="w-full md:w-auto bg-accent-primary hover:bg-accent-primary/90 text-white transition-colors px-5 py-2.5 rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 whitespace-nowrap"
        >
          Continue in LMS
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};
