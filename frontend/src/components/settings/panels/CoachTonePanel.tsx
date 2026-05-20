import { useSettingsStore } from '../../../store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const tones = [
  { id: 'warm', label: 'Warm and casual', desc: 'Like a supportive friend checking in' },
  { id: 'balanced', label: 'Balanced', desc: 'Friendly but gets to the point' },
  { id: 'brief', label: 'Focused and brief', desc: 'Short messages, no small talk' }
] as const;

export const CoachTonePanel = ({ onClose }: { onClose: () => void }) => {
  const { coachTone, set } = useSettingsStore();

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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Coach tone</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {tones.map((t) => {
          const selected = coachTone === t.id;
          return (
            <button
              key={t.id}
              onClick={() => set({ coachTone: t.id })}
              className={`flex flex-col items-start p-4 rounded-[12px] border text-left transition-colors duration-200 ${
                selected 
                  ? 'border-accent-sage bg-accent-sage/10' 
                  : 'border-border-light dark:border-border-dark bg-bg-secondary dark:bg-bg-darkCard hover:bg-border-light/10 dark:hover:bg-border-dark/30'
              }`}
            >
              <span className={`font-medium text-[14px] ${selected ? 'text-accent-sage' : 'text-text-primary dark:text-text-darkPri'}`}>
                {t.label}
              </span>
              <span className={`text-[12px] mt-1 ${selected ? 'text-accent-sage/80' : 'text-text-secondary dark:text-text-darkSec'}`}>
                {t.desc}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
