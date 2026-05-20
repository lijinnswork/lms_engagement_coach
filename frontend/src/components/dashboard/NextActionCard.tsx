import { motion } from 'framer-motion';

interface NextActionCardProps {
  label: string;
  text: string;
  courseId: string;
}

import { useNavigate } from 'react-router-dom';

export const NextActionCard = ({ label, text, courseId }: NextActionCardProps) => {
  const navigate = useNavigate();
  return (
    <motion.button
      onClick={() => navigate(`/course/${courseId}`)}
      whileHover={{ x: 2, y: -2 }}
      transition={{ duration: 0.2 }}
      className="w-full text-left bg-bg-secondary dark:bg-bg-darkCard border-y border-r border-border-light dark:border-border-dark border-l-[3px] border-l-accent-peach rounded-xl p-4 shadow-sm"
    >
      <div className="text-[8px] uppercase tracking-wider font-sans text-accent-peach mb-1 font-medium">
        {label}
      </div>
      <div className="text-[11px] font-sans text-text-primary dark:text-text-darkPri leading-[1.55]">
        {text}
      </div>
    </motion.button>
  );
};
