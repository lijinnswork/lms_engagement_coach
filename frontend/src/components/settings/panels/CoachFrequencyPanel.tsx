import { useSettingsStore } from '../../../store/settingsStore';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const CoachFrequencyPanel = ({ onClose }: { onClose: () => void }) => {
  const { coachFrequency, set } = useSettingsStore();

  const handleMinus = () => {
    if (coachFrequency > 1) {
      set({ coachFrequency: coachFrequency - 1 });
    }
  };

  const handlePlus = () => {
    if (coachFrequency < 7) {
      set({ coachFrequency: coachFrequency + 1 });
    }
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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Check-in frequency</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center pt-10">
        <div className="flex flex-col items-center max-w-[240px]">
          <div className="flex items-center gap-6 mb-4">
            <button 
              onClick={handleMinus}
              disabled={coachFrequency <= 1}
              className="w-12 h-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-border-light/20 dark:hover:bg-border-dark/40 transition-colors"
            >
              <Minus size={20} />
            </button>
            <span className="text-[24px] font-medium text-text-primary dark:text-text-darkPri min-w-[30px] text-center">
              {coachFrequency}
            </span>
            <button 
              onClick={handlePlus}
              disabled={coachFrequency >= 7}
              className="w-12 h-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-border-light/20 dark:hover:bg-border-dark/40 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <p className="text-[12px] text-text-secondary dark:text-text-darkSec text-center leading-relaxed">
            The coach will never exceed this number of messages in a week.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
