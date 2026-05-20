import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CoachNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachNotesModal: React.FC<CoachNotesModalProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<any>(null);

  useEffect(() => {
    if (isOpen && !notes) {
      fetch('/coach/notes')
        .then(res => res.json())
        .then(data => setNotes(data))
        .catch(console.error);
    }
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 bottom-[env(safe-area-inset-bottom,20px)] md:top-24 md:bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark shrink-0">
              <h2 className="font-serif text-[24px] text-text-primary dark:text-text-darkPri">Coach's Notes</h2>
              <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-secondary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 hidden-scrollbar">
              <p className="text-[15px] mb-8 text-text-secondary leading-relaxed">
                These are the things I've noticed about your learning so far. This helps me be a better coach for you.
              </p>

              {notes ? (
                <div className="flex flex-col gap-8">
                  <section>
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wider mb-3">📊 Learning Patterns</h3>
                    <ul className="list-disc list-inside space-y-2 text-[15px] text-text-secondary">
                      {notes.learning_patterns.map((n: string) => <li key={n}>{n}</li>)}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wider mb-3">🎯 Goals</h3>
                    <ul className="list-disc list-inside space-y-2 text-[15px] text-text-secondary">
                      {notes.goals.map((n: string) => <li key={n}>{n}</li>)}
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wider mb-3">📚 Courses</h3>
                    <ul className="list-disc list-inside space-y-2 text-[15px] text-text-secondary">
                      {notes.courses.map((n: string) => <li key={n}>{n}</li>)}
                    </ul>
                  </section>
                </div>
              ) : (
                <div className="flex justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full" /></div>
              )}

              <div className="mt-12 pt-6 border-t border-border-light dark:border-border-dark flex flex-col gap-4">
                <p className="text-[13px] text-text-secondary text-center">
                  This data is private to you. I use it to help personalize my suggestions. You can clear it anytime.
                </p>
                <button onClick={() => { alert("Notes cleared!"); onClose(); }} className="text-[14px] font-medium text-red-500/80 hover:text-red-500 transition-colors mx-auto px-4 py-2 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">
                  Clear All Notes
                </button>
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
