import { useBreakpoint } from '../hooks/useBreakpoint';
import { SettingsMasterPanel } from '../components/settings/SettingsMasterPanel';
import { Home, MessageSquare, Target, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();

  return (
    <div className="w-full bg-bg-primary dark:bg-bg-dark min-h-screen flex flex-col h-[100dvh]">
      {breakpoint === 'mobile' && (
        <div className="px-4 py-4 flex items-center justify-between border-b border-border-light dark:border-border-dark bg-bg-primary dark:bg-bg-dark shrink-0">
          <h1 className="font-serif text-[24px] text-text-primary dark:text-text-darkPri">Settings</h1>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <SettingsMasterPanel />
      </div>

      {breakpoint === 'mobile' && (
        <div className="shrink-0 bg-bg-secondary dark:bg-bg-darkCard border-t border-border-light dark:border-border-dark flex justify-around items-center pt-3 pb-[max(env(safe-area-inset-bottom),20px)] px-2 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors">
            <Home size={20} />
            <span className="text-[10px] font-sans font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors">
            <MessageSquare size={20} />
            <span className="text-[10px] font-sans font-medium">Coach</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors">
            <Target size={20} />
            <span className="text-[10px] font-sans font-medium">Goals</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors">
            <BookOpen size={20} />
            <span className="text-[10px] font-sans font-medium">Reflect</span>
          </button>
        </div>
      )}
    </div>
  );
};
