import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, X, Edit2 } from 'lucide-react';
import { useRemindersStore } from '../../store/useRemindersStore';

export const CoachSuggestions: React.FC<{ onEdit: (suggestion: any) => void }> = ({ onEdit }) => {
  const { suggestions } = useRemindersStore();

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--coach-primary)]">
        <Sparkles size={16} />
        <h2 className="text-sm font-semibold tracking-wide uppercase">Coach Suggestions</h2>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion) => (
          <motion.div 
            key={suggestion.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative bg-gradient-to-r from-[var(--coach-primary)]/10 to-[var(--coach-primary)]/5 border border-[var(--coach-primary)]/20 rounded-[16px] p-5"
          >
            <div className="pr-[180px]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{suggestion.suggested_title}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1 font-medium">{suggestion.reasoning}</p>
              <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-[var(--coach-primary)] bg-[var(--coach-primary)]/10 px-2 py-1 rounded-md w-fit">
                <span>{new Date(suggestion.suggested_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                <span>•</span>
                <span>{suggestion.suggested_time}</span>
              </div>
            </div>

            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                onClick={() => onEdit(suggestion)}
                className="p-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors"
                title="Edit Suggestion"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => alert("Suggestion dismissed!")}
                className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                title="Dismiss"
              >
                <X size={20} />
              </button>
              <button 
                onClick={() => alert("Suggestion accepted!")}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--coach-primary)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Check size={16} />
                Accept
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
