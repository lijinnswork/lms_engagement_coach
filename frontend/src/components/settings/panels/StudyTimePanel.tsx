import { useSettingsStore } from '../../../store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const times = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' }
] as const;

export const StudyTimePanel = ({ onClose }: { onClose: () => void }) => {
  const { studyTime, set } = useSettingsStore();

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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Best time to study</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          {times.map((t) => {
            const selected = studyTime === t.id;
            return (
              <button
                key={t.id}
                onClick={() => set({ studyTime: t.id })}
                className={`px-5 py-2.5 rounded-full border text-[13px] font-medium transition-colors ${
                  selected 
                    ? 'border-accent-sage bg-accent-sage/10 text-accent-sage' 
                    : 'border-border-light dark:border-border-dark bg-bg-secondary dark:bg-bg-darkCard text-text-secondary dark:text-text-darkSec hover:bg-border-light/10 dark:hover:bg-border-dark/30 hover:text-text-primary dark:hover:text-text-darkPri'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-[13px] text-text-secondary dark:text-text-darkSec">
          Helps the coach reach you when you're most likely engaged.
        </p>
      </div>
    </motion.div>
  );
};
