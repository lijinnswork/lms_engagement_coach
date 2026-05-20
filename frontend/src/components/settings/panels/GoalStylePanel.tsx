import { useSettingsStore } from '../../../store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const styles = [
  { id: 'weekly', label: 'Weekly targets', desc: 'Set and review goals each week' },
  { id: 'milestone', label: 'Milestone-based', desc: 'Goals tied to course checkpoints' },
  { id: 'open', label: 'Open-ended', desc: 'No fixed deadlines, just intentions' }
] as const;

export const GoalStylePanel = ({ onClose }: { onClose: () => void }) => {
  const { goalStyle, set } = useSettingsStore();

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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Goal style</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {styles.map((s) => {
          const selected = goalStyle === s.id;
          return (
            <button
              key={s.id}
              onClick={() => set({ goalStyle: s.id })}
              className={`flex flex-col items-start p-4 rounded-[12px] border text-left transition-colors duration-200 ${
                selected 
                  ? 'border-accent-mint bg-accent-mint/10' 
                  : 'border-border-light dark:border-border-dark bg-bg-secondary dark:bg-bg-darkCard hover:bg-border-light/10 dark:hover:bg-border-dark/30'
              }`}
            >
              <span className={`font-medium text-[14px] ${selected ? 'text-accent-mint' : 'text-text-primary dark:text-text-darkPri'}`}>
                {s.label}
              </span>
              <span className={`text-[12px] mt-1 ${selected ? 'text-accent-mint/80' : 'text-text-secondary dark:text-text-darkSec'}`}>
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
