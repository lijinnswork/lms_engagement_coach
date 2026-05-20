import React from 'react';
import { Target, Calendar, BarChart2 } from 'lucide-react';

interface CoachQuickActionsProps {
  onActionSelect: (action: string, contextTag: string) => void;
  disabled?: boolean;
}

const actions = [
  { icon: Calendar, label: "What's coming up?", text: "Can you summarize my upcoming assignments and deadlines?", tag: "upcoming_summary" },
  { icon: Target, label: "Help me set a goal", text: "I'd like help setting a learning goal.", tag: "goal_suggestion" },
  { icon: BarChart2, label: "How am I doing?", text: "How am I doing with my learning?", tag: "check_in" }
];

export const CoachQuickActions: React.FC<CoachQuickActionsProps> = ({ onActionSelect, disabled }) => {
  return (
    <div className="w-full pb-2">
      <div className="flex w-full md:grid md:grid-cols-3 gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              onClick={() => onActionSelect(act.text, act.tag)}
              disabled={disabled}
              className="shrink-0 h-[36px] px-4 rounded-full border border-border-light dark:border-border-dark bg-bg-secondary dark:bg-bg-dark flex items-center justify-center gap-2 hover:border-accent-primary hover:bg-accent-primary/5 active:scale-95 transition-all outline-none whitespace-nowrap disabled:opacity-50 group md:w-full"
            >
              <Icon size={14} className="text-text-secondary group-hover:text-accent-primary transition-colors" />
              <span className="text-[13px] text-text-primary">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
