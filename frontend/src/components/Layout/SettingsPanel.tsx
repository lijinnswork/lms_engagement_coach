import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { SoftCard } from '../Common/SoftCard';
import { GentleButton } from '../Common/GentleButton';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-primary)] shadow-2xl border-l border-[var(--border)] z-50 overflow-y-auto"
          >
            <div className="p-6">
              <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                  <h2 className="text-2xl font-serif text-[var(--text-primary)]">Settings</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[var(--border)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </header>

              <div className="space-y-6">
                <SoftCard>
                  <h3 className="font-medium text-lg text-[var(--text-primary)] mb-4">Appearance</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Theme Preference</span>
                    <select className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-3 py-1 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]">
                       <option>Follow System</option>
                       <option>Light Mode</option>
                       <option>Dark Mode</option>
                    </select>
                  </div>
                </SoftCard>

                <SoftCard>
                  <h3 className="font-medium text-lg text-[var(--text-primary)] mb-4">Notification Boundaries</h3>
                  <div className="space-y-4 text-sm">
                     <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Coach check-ins</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--accent-primary)]" />
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Quiet Hours Start</span>
                        <input type="time" defaultValue="22:00" className="bg-transparent text-[var(--text-primary)] border-b border-[var(--border)] focus:outline-none focus:border-[var(--accent-primary)]" />
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Quiet Hours End</span>
                        <input type="time" defaultValue="08:00" className="bg-transparent text-[var(--text-primary)] border-b border-[var(--border)] focus:outline-none focus:border-[var(--accent-primary)]" />
                     </div>
                  </div>
                </SoftCard>

                {/* Additional Settings Placeholder - to prompt user */}
                <SoftCard className="border-dashed bg-transparent border-2">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">More Settings?</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    What other settings would you like to add here?
                  </p>
                </SoftCard>

                <div className="flex justify-center pt-6">
                   <GentleButton variant="text" className="text-red-500 hover:text-red-600 font-medium">
                      Sign out
                   </GentleButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
