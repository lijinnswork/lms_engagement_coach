import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const ActiveSessionsPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      variants={{
        hidden:  { x: '100%', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
        exit:    { x: '100%', opacity: 0, transition: { duration: 0.2 } }
      }}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 bg-bg-primary dark:bg-bg-dark z-50 flex flex-col pt-8 lg:pt-10"
    >
      <div className="flex items-center gap-3 px-4 pb-4 border-b border-border-light dark:border-border-dark shrink-0">
        <button onClick={onClose} className="text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Active Sessions</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <p className="text-sm text-text-secondary">Your active sessions will appear here.</p>
      </div>
    </motion.div>
  );
};
