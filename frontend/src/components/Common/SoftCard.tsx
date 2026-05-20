import React from 'react';
import { motion } from 'framer-motion';

interface SoftCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const SoftCard: React.FC<SoftCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  hoverable = false
}) => {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" } : {}}
      onClick={onClick}
      className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 ${hoverable ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};
