import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExportDataPanel = ({ onClose }: { onClose: () => void }) => {
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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Export my data</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <p className="text-[14px] text-text-primary dark:text-text-darkPri leading-relaxed">
          You can request a copy of all the data linked to your account. This includes your profile details, learning rhythm history, all conversation logs with the coach, and your collected reflections.
        </p>

        <p className="text-[13px] text-text-secondary dark:text-text-darkSec">
          Your data belongs to you.
        </p>
      </div>

      <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col gap-3">
        <button className="w-full bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-text-primary dark:text-text-darkPri font-medium py-3 rounded-[12px] hover:bg-border-light/20 dark:hover:bg-border-dark/30 transition-colors">
          Download as JSON
        </button>
        <button className="w-full bg-border-light dark:bg-border-dark text-text-primary dark:text-text-darkPri font-medium py-3 rounded-[12px] hover:bg-border-light/80 dark:hover:bg-border-dark/80 transition-colors">
          Download as PDF
        </button>
      </div>
    </motion.div>
  );
};
