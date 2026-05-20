import React from 'react';
import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useRemindersStore } from '../../store/useRemindersStore';

export const NotificationPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { suggestions, pendingCount } = useRemindersStore();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="absolute top-16 right-4 w-80 bg-[var(--bg-surface)] border border-[var(--border-light)] dark:border-[var(--border-dark)] rounded-2xl shadow-xl z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)] dark:border-[var(--border-dark)] bg-[var(--bg-app)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
            <Bell size={16} />
            Notifications
            {pendingCount > 0 && (
              <span className="bg-[var(--coach-primary)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-tertiary)]">
              <Bell size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-light)] dark:divide-[var(--border-dark)]">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-4 hover:bg-[var(--bg-app)] transition-colors cursor-pointer">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{suggestion.suggested_title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{suggestion.reasoning}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="text-xs bg-[var(--coach-primary)] text-white px-3 py-1.5 rounded-full font-medium">
                      Accept
                    </button>
                    <button className="text-xs bg-[var(--bg-surface)] border border-[var(--border-light)] dark:border-[var(--border-dark)] text-[var(--text-secondary)] px-3 py-1.5 rounded-full font-medium">
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
