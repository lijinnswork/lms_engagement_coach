import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../../store/dashboardStore';

interface CoachCardProps {
  message: string;
  triggeredBy: string;
}

import { useNavigate } from 'react-router-dom';

export const CoachCard = ({ message }: CoachCardProps) => {
  const { coachCardVisible, replyOpen, replyText, dismissCoachCard, toggleReply, setReplyText } = useDashboardStore();
  const navigate = useNavigate();

  if (!coachCardVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
        className="w-full bg-coach-light dark:bg-coach-dark rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[6px] h-[6px] rounded-full bg-accent-sage" />
          <span className="text-[9px] uppercase font-sans text-accent-sage font-medium tracking-wider">Your Coach</span>
        </div>
        
        <p className="font-serif italic text-[13px] text-text-primary dark:text-text-darkPri leading-[1.7] mb-4">
          {message}
        </p>

        {!replyOpen ? (
          <div className="flex gap-2">
            <button 
              onClick={toggleReply}
              className="bg-accent-sage hover:bg-accent-sage/90 text-white transition-colors px-4 py-1.5 rounded-full text-[11px] font-sans font-medium"
            >
              Reply
            </button>
            <button 
              onClick={dismissCoachCard}
              className="border border-accent-sage text-accent-sage hover:bg-accent-sage/10 transition-colors px-4 py-1.5 rounded-full text-[11px] font-sans font-medium"
            >
              Not now
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full"
          >
            <textarea
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write something..."
              className="w-full bg-bg-secondary dark:bg-bg-darkCard text-[12px] font-sans border-border-light dark:border-border-dark p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-sage text-text-primary dark:text-text-darkPri resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={toggleReply}
                className="text-[11px] font-sans text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri px-3 py-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => { toggleReply(); navigate('/coach'); }}
                className="bg-accent-sage hover:bg-accent-sage/90 text-white transition-colors px-4 py-1.5 rounded-full text-[11px] font-sans font-medium"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
