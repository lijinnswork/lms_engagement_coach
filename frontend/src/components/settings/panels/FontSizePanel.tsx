import { useSettingsStore, type SettingsStore } from '../../../store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const sizes: { id: SettingsStore['fontSize'], label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Larger' }
];

export const FontSizePanel = ({ onClose }: { onClose: () => void }) => {
  const { fontSize, set } = useSettingsStore();

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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Font size</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {sizes.map((s) => {
            const selected = fontSize === s.id;
            return (
              <button
                key={s.id}
                onClick={() => set({ fontSize: s.id })}
                className={`flex items-center p-4 rounded-[12px] border text-left transition-colors duration-200 ${
                  selected 
                    ? 'border-accent-sand bg-accent-sand/10 text-accent-sand' 
                    : 'border-border-light dark:border-border-dark bg-bg-secondary dark:bg-bg-darkCard text-text-primary dark:text-text-darkPri hover:bg-border-light/10 dark:hover:bg-border-dark/30'
                }`}
              >
                <span className="font-medium text-[14px]">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-[14px] p-5">
          <p className="text-text-secondary dark:text-text-darkSec mb-2 text-[12px] uppercase font-semibold tracking-wide">Preview</p>
          <p className={`text-text-primary dark:text-text-darkPri leading-relaxed transition-all duration-300 ${fontSize === 'large' ? 'text-[16px]' : 'text-[14px]'}`}>
            The AI coach will adapt based on your progress. It might check in on a specific module you're struggling with, or simply offer an encouraging word when you've maintained a steady rhythm. The tone and frequency are fully under your control.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
