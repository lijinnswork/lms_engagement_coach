import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { CoachQuickActions } from './CoachQuickActions';

interface CoachInputBarProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text?: string, contextTag?: string) => void;
  isTyping: boolean;
}

export const CoachInputBar: React.FC<CoachInputBarProps> = ({ input, setInput, onSend, isTyping }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isTyping) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full bg-bg-secondary dark:bg-bg-dark border-t border-border-light dark:border-border-dark px-4 md:px-6 py-3 shrink-0">
      <div className="w-full">
        <CoachQuickActions onActionSelect={(text, tag) => onSend(text, tag)} disabled={isTyping} />
        
        <div className="relative flex items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            placeholder={isTyping ? "Coach is replying..." : "Share what's on your mind..."}
            className={`w-full bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-[24px] pl-5 pr-14 py-3.5 focus:outline-none focus:border-accent-primary shadow-sm text-[15px] text-text-primary resize-none placeholder:font-serif placeholder:italic placeholder:opacity-50 disabled:opacity-70`}
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 w-[36px] h-[36px] bg-text-primary dark:bg-text-darkPri text-bg-primary dark:text-bg-dark rounded-full flex items-center justify-center disabled:opacity-30 disabled:bg-text-primary hover:scale-105 transition-all"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
