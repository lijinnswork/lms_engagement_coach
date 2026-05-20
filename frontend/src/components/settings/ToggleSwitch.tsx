import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export const ToggleSwitch = ({ value, onChange }: ToggleSwitchProps) => {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
      className={`w-[34px] h-[20px] rounded-full p-[2px] cursor-pointer transition-colors duration-200 ease-in-out shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-sage
        ${value ? 'bg-accent-sage' : 'bg-border-light dark:bg-border-dark/60'}
      `}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="w-4 h-4 rounded-full bg-white shadow-sm"
        style={{ x: value ? 14 : 0 }}
      />
    </button>
  );
};
