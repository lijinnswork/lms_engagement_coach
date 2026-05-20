import { useState } from 'react';
import { useSettingsStore } from '../../../store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const QuietHoursPanel = ({ onClose }: { onClose: () => void }) => {
  const { quietStart, quietEnd, set } = useSettingsStore();
  const [start, setStart] = useState(quietStart);
  const [end, setEnd] = useState(quietEnd);

  const handleSave = () => {
    set({ quietStart: start, quietEnd: end });
    onClose();
  };

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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Quiet hours</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col pt-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <input 
            type="time" 
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[16px] font-medium text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-peach transition-colors"
          />
          <span className="text-[13px] text-text-secondary dark:text-text-darkSec">and</span>
          <input 
            type="time" 
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[16px] font-medium text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-peach transition-colors"
          />
        </div>
        <p className="text-[13px] text-text-secondary dark:text-text-darkSec text-center max-w-[260px] mx-auto">
          The coach will never send messages during this window.
        </p>
      </div>

      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <button 
          onClick={handleSave}
          className="w-full bg-accent-sage text-white font-medium py-3 rounded-[12px] hover:bg-accent-sage/90 transition-colors"
        >
          Save changes
        </button>
      </div>
    </motion.div>
  );
};
