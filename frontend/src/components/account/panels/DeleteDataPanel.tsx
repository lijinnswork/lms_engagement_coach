import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const DeleteDataPanel = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<'initial' | 'confirm' | 'done'>('initial');

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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Delete my data</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {step !== 'done' ? (
          <p className="text-[13px] text-text-secondary dark:text-text-darkSec leading-[1.7]">
            This will permanently remove all your learning history, reflections, and chat logs with the coach. Your account will remain active, but the coach will lose all context of your past progress, starting completely fresh.
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center pt-12 text-center text-accent-sage">
            <CheckCircle size={48} className="mb-4 opacity-80" />
            <p className="text-[14px] font-medium text-text-primary dark:text-text-darkPri mb-1">Data removed</p>
            <p className="text-[13px] text-text-secondary dark:text-text-darkSec">Your history has been cleared.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col gap-3 pb-8">
        {step === 'initial' && (
          <button 
            onClick={() => setStep('confirm')}
            className="w-full bg-transparent border-[1.5px] border-[#A05050]/30 text-[#A05050] font-medium py-3 rounded-[12px] hover:bg-[#A05050]/5 transition-colors"
          >
            Delete all my data
          </button>
        )}

        {step === 'confirm' && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-text-primary dark:text-text-darkPri font-medium text-center">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setStep('initial')}
                className="flex-1 bg-border-light dark:bg-border-dark text-text-primary dark:text-text-darkPri font-medium py-3 rounded-[12px] hover:bg-border-light/80 dark:hover:bg-border-dark/80 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setStep('done')}
                className="flex-1 bg-[#A05050] text-white font-medium py-3 rounded-[12px] hover:bg-[#A05050]/90 transition-colors"
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <button 
            onClick={onClose}
            className="w-full bg-border-light dark:bg-border-dark text-text-primary dark:text-text-darkPri font-medium py-3 rounded-[12px] hover:bg-border-light/80 dark:hover:bg-border-dark/80 transition-colors"
          >
            Return to settings
          </button>
        )}
      </div>
    </motion.div>
  );
};
