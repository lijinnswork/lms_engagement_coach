import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

export const NotificationToast: React.FC<{ message: string | null; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--coach-primary)]/30 shadow-lg shadow-[var(--coach-primary)]/10 px-4 py-3 rounded-2xl min-w-[300px]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--coach-primary)]/10 flex items-center justify-center text-[var(--coach-primary)]">
            <Bell size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">New Reminder</h4>
            <p className="text-[12px] text-[var(--text-secondary)]">{message}</p>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
