import { Check } from 'lucide-react';

export const GoalItem = ({ goal, onToggle }: { goal: any, onToggle?: (id: string) => void }) => {
  // Gracefully handle mock vs real API data
  const isReal = goal.status !== undefined; 
  
  const isDone = isReal ? goal.status === 'completed' : goal.done;
  const isProposed = isReal ? goal.status === 'proposed' : goal.status === 'proposed';
  const name = isReal ? goal.title : goal.name;
  
  // Real data provides progress_percent, mock gives meta string
  const meta = isReal 
    ? (goal.course_id ? `Course Goal · ${goal.progress_percent}% completed` : `General Goal · ${goal.progress_percent}% completed`) 
    : goal.meta;

  const getBadgeStyle = () => {
    if (isDone) return "bg-accent-sage/13 text-accent-sage";
    if (isProposed) return "bg-accent-peach/13 text-accent-peach";
    return "bg-accent-sage/13 text-accent-sage";
  };

  const getBadgeText = () => {
    if (isDone) return "Done";
    if (isProposed) return "Review";
    return "Active";
  };

  const isDashed = !isDone && (isReal ? goal.proposed_by === 'coach' : goal.proposedBy === 'coach');

  return (
    <div 
      className="flex items-start gap-3 py-3 w-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2"
    >
      <div className="mt-0.5 shrink-0">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle?.(goal.id); }}
          className={`w-[15px] h-[15px] rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
            isDone 
              ? 'bg-accent-mint border border-accent-mint' 
              : isDashed 
                ? 'border border-dashed border-text-secondary dark:border-text-darkSec' 
                : 'border border-text-secondary dark:border-text-darkSec'
          }`}
        >
          {isDone && <Check size={10} className="text-white" strokeWidth={3} />}
        </button>
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <div className={`text-[11px] font-sans line-clamp-1 mb-0.5 ${
          isDone ? 'text-text-secondary dark:text-text-darkSec' : 'text-text-primary dark:text-text-darkPri'
        }`}>
          {name}
        </div>
        <div className="text-[9px] font-sans text-text-secondary dark:text-text-darkSec line-clamp-1">
          {meta}
        </div>
      </div>

      <div className={`shrink-0 rounded-[4px] px-2 py-[2px] text-[9px] font-sans font-medium uppercase tracking-wider ${getBadgeStyle()}`}>
        {getBadgeText()}
      </div>
    </div>
  );
};
