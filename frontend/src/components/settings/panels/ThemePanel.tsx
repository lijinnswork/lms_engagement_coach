import { useSettingsStore, type SettingsStore } from '../../../store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const themes: { id: SettingsStore['theme'], label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System default' },
  { id: 'dark', label: 'Dark' }
];

export const ThemePanel = ({ onClose }: { onClose: () => void }) => {
  const { theme, set } = useSettingsStore();

  const handleThemeChange = (newTheme: SettingsStore['theme']) => {
    set({ theme: newTheme });
    
    // Immediate DOM application (system matching is complex, handling simple dark class toggle for now)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System logic
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Theme</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {themes.map((t) => {
          const selected = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`flex items-center p-4 rounded-[12px] border text-left transition-colors duration-200 ${
                selected 
                  ? 'border-accent-sand bg-accent-sand/10 text-accent-sand' 
                  : 'border-border-light dark:border-border-dark bg-bg-secondary dark:bg-bg-darkCard text-text-primary dark:text-text-darkPri hover:bg-border-light/10 dark:hover:bg-border-dark/30'
              }`}
            >
              <span className="font-medium text-[14px]">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
