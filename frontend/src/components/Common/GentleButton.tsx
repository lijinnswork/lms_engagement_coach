import React from 'react';
import { motion } from 'framer-motion';

import type { HTMLMotionProps } from 'framer-motion';

interface GentleButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'accent-warm' | 'accent-soft' | 'text';
  children: React.ReactNode;
}

export const GentleButton: React.FC<GentleButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "px-6 py-3 rounded-full font-medium transition-all duration-400 ease-out flex items-center justify-center";
  
  const variants = {
    'primary': "bg-[var(--accent-primary)] text-white hover:brightness-105",
    'secondary': "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:brightness-[0.96] dark:hover:brightness-105",
    'accent-warm': "bg-[var(--accent-warm)] text-white hover:brightness-105",
    'accent-soft': "bg-[var(--accent-soft)] text-[#2C2A36] hover:brightness-105",
    'text': "text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1"
  };

  return (
    <motion.button
      whileHover={{ scale: variant === 'text' ? 1 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
