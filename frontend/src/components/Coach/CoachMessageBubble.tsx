import React from 'react';
import { motion } from 'framer-motion';

export interface CoachMessageProps {
  id: string;
  sender: 'coach' | 'student';
  content: string;
  timestamp: string;
}

export const CoachMessageBubble: React.FC<CoachMessageProps> = ({ sender, content, timestamp }) => {
  const isCoach = sender === 'coach';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isCoach ? 0.4 : 0.3, ease: 'easeOut' }}
      className={`flex w-full mb-6 ${isCoach ? 'justify-start' : 'justify-end'}`}
    >
      <div 
        className={`relative max-w-[85%] md:max-w-[70%] lg:max-w-[70%] p-4 rounded-2xl ${
          isCoach 
            ? 'bg-[#F5F0EB] dark:bg-[#2A2E3A] rounded-tl-sm ml-0 md:ml-[60px]' 
            : 'bg-accent-sage/15 dark:bg-accent-sage/20 rounded-tr-sm mr-0 md:mr-[60px]'
        }`}
      >
        {isCoach && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-sage"></span>
            <span className="text-[12px] font-bold text-accent-sage uppercase tracking-wider">Coach</span>
          </div>
        )}
        <p className={`text-[15px] leading-relaxed text-text-primary ${isCoach ? 'font-serif italic' : 'font-sans'}`}>
          {content}
        </p>
        <div className={`mt-2 text-[11px] text-text-secondary ${isCoach ? 'text-right' : 'text-right'}`}>
          {timestamp}
        </div>
      </div>
    </motion.div>
  );
};
