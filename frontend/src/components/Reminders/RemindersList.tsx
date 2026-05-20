import React from 'react';
import { motion } from 'framer-motion';
import { useRemindersStore } from '../../store/useRemindersStore';
import { Clock, Calendar, CheckCircle2, ChevronRight, BellRing } from 'lucide-react';

const ReminderItem: React.FC<{ reminder: any; onEdit: (r: any) => void }> = ({ reminder, onEdit }) => {
  const isCompleted = reminder.status === 'completed';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex items-center gap-4 p-4 rounded-[12px] border ${isCompleted ? 'bg-[var(--bg-app)] border-transparent opacity-60' : 'bg-[var(--bg-surface)] border-[var(--border-light)] dark:border-[var(--border-dark)] hover:border-[var(--coach-primary)]/50'} transition-all cursor-pointer`}
      onClick={() => onEdit(reminder)}
    >
      <button 
        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'border-[var(--text-tertiary)] hover:border-[var(--coach-primary)]'}`}
        onClick={(e) => {
          e.stopPropagation();
          alert(isCompleted ? "Marked as active!" : "Marked as complete!");
        }}
      >
        {isCompleted && <CheckCircle2 size={14} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <h3 className={`text-[15px] font-semibold truncate ${isCompleted ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
          {reminder.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {reminder.time}
          </span>
          {reminder.course_id && (
            <span className="truncate max-w-[120px] bg-[var(--bg-app)] px-2 py-0.5 rounded-md">
              {reminder.course_id}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
};

export const RemindersList: React.FC<{ onEdit: (r: any) => void }> = ({ onEdit }) => {
  const { reminders } = useRemindersStore();

  const sections = [
    { key: 'today', label: 'Today', icon: <BellRing size={16} /> },
    { key: 'tomorrow', label: 'Tomorrow', icon: <Calendar size={16} /> },
    { key: 'week', label: 'This Week', icon: <Calendar size={16} /> },
    { key: 'later', label: 'Later', icon: <Calendar size={16} /> },
    { key: 'completed', label: 'Completed', icon: <CheckCircle2 size={16} /> },
  ];

  return (
    <div className="space-y-8">
      {sections.map(({ key, label, icon }) => {
        const items = reminders[key as keyof typeof reminders] || [];
        if (items.length === 0 && key !== 'today') return null;

        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider">
              {icon}
              <h3>{label}</h3>
              <span className="text-[10px] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            
            {items.length === 0 ? (
              <div className="p-8 text-center bg-[var(--bg-surface)] rounded-[16px] border border-dashed border-[var(--border-light)] dark:border-[var(--border-dark)]">
                <p className="text-[13px] text-[var(--text-tertiary)] font-medium">No reminders for {label.toLowerCase()}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((reminder) => (
                  <ReminderItem key={reminder.id} reminder={reminder} onEdit={onEdit} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
