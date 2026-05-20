import React from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { motion } from 'framer-motion';

interface CoachChatHeaderProps {
  onSearchClick: () => void;
  onNotesClick: () => void;
}

export const CoachChatHeader: React.FC<CoachChatHeaderProps> = ({ onSearchClick, onNotesClick }) => {
  const breakpoint = useBreakpoint();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="h-[56px] border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sticky top-0 bg-bg-secondary/90 dark:bg-bg-darkCard/90 backdrop-blur-md z-30">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-darkPri tracking-tight">Your Coach</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 relative">
        {breakpoint !== 'mobile' ? (
          <button 
            onClick={onSearchClick}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Search size={18} />
          </button>
        ) : null}
        
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <MoreVertical size={18} />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-2 w-48 bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg py-2 z-50 overflow-hidden"
          >
            {breakpoint === 'mobile' && (
              <button onClick={() => { onSearchClick(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[14px] text-text-primary hover:bg-bg-secondary dark:hover:bg-bg-darkCard flex items-center justify-between">
                Search
                <Search size={14} className="text-text-secondary" />
              </button>
            )}
            <button onClick={() => { onNotesClick(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[14px] text-text-primary hover:bg-bg-secondary dark:hover:bg-bg-darkCard">
              Coach's Notes
            </button>
            <button onClick={() => { setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[14px] text-text-primary hover:bg-bg-secondary dark:hover:bg-bg-darkCard">
              Nudge Settings
            </button>
            <button onClick={() => { setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[14px] text-text-primary hover:bg-bg-secondary dark:hover:bg-bg-darkCard">
              Clear Chat Display
            </button>
          </motion.div>
        )}
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
      )}
    </div>
  );
};
