import React from 'react';
import { motion } from 'framer-motion';

interface CoachBubbleProps {
  sender: 'coach' | 'student';
  content: string;
}

export const CoachBubble: React.FC<CoachBubbleProps> = ({ sender, content }) => {
  const isCoach = sender === 'coach';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex ${isCoach ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div 
        className={`max-w-[80%] rounded-2xl px-5 py-4 ${
          isCoach 
          ? 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none font-serif italic text-lg shadow-sm'
          : 'bg-[var(--accent-primary)] text-white rounded-tr-none text-base'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </motion.div>
  );
};
