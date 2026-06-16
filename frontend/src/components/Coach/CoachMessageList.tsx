import React, { useRef, useEffect, useState } from 'react';
import { CoachMessageBubble, type CoachMessageProps } from './CoachMessageBubble';
import { RefreshCw, Compass } from 'lucide-react';

interface CoachMessageListProps {
  messages: CoachMessageProps[];
  isTyping: boolean;
  timeoutError?: boolean;
  onRetry?: () => void;
}

export const CoachMessageList: React.FC<CoachMessageListProps> = ({ messages, isTyping, timeoutError, onRetry }) => {
  const getFriendlyDateString = (isoString?: string) => {
    if (!isoString) return "Today";
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollPill, setShowScrollPill] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      // New message arrived
      if (!showScrollPill) {
        scrollToBottom();
      }
    } else if (isTyping) {
      if (!showScrollPill) {
        scrollToBottom();
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isTyping, showScrollPill]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // If we're scrolled up by more than 100px from the bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollPill(isScrolledUp);
  };

  return (
    <div className="flex-1 w-full relative overflow-hidden bg-bg-primary dark:bg-bg-dark">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto hidden-scrollbar px-4 md:px-0 py-6 scroll-smooth"
      >
        <div className="max-w-[800px] mx-auto w-full flex flex-col pt-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-80">
              <div className="mb-6 h-[64px] w-[64px] rounded-full bg-accent-primary/10 flex items-center justify-center">
                <Compass size={32} className="text-accent-primary opacity-80" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-serif text-text-primary mb-2">Hi there</h3>
              <p className="text-text-secondary text-center max-w-[300px] leading-relaxed">
                I'm your coach. I'm here when you want to talk, and quiet when you don't. What's on your mind?
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const msgDate = msg.created_at ? new Date(msg.created_at).toDateString() : "";
              const prevCreatedAt = idx > 0 ? messages[idx - 1].created_at : undefined;
              const prevMsgDate = prevCreatedAt ? new Date(prevCreatedAt).toDateString() : "";
              const showDateCluster = idx === 0 || msgDate !== prevMsgDate;
              return (
                <React.Fragment key={msg.id}>
                  {showDateCluster && (
                    <div className="flex justify-center mb-6 mt-4">
                      <span className="px-3 py-1 rounded-full bg-border-light dark:bg-border-dark text-[12px] text-text-secondary font-medium">
                        {getFriendlyDateString(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <CoachMessageBubble {...msg} />
                </React.Fragment>
              );
            })
          )}

          {isTyping && !timeoutError && (
            <div className="flex justify-start mb-6 w-full">
              <div className="bg-[#F5F0EB] dark:bg-[#2A2E3A] px-5 py-4 rounded-2xl rounded-tl-sm flex flex-col gap-2 ml-0 md:ml-[60px]">
                <div className="flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-accent-sage"></span>
                   <span className="text-[12px] font-bold text-accent-sage uppercase tracking-wider">Coach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[13px] font-serif italic text-text-secondary">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {timeoutError && (
             <div className="flex justify-start mb-6 w-full">
              <div className="bg-[#F5F0EB] dark:bg-[#2A2E3A] px-5 py-4 rounded-2xl rounded-tl-sm flex flex-col gap-2 ml-0 md:ml-[60px] max-w-[85%] md:max-w-[70%]">
                 <p className="text-[14px] text-text-primary mb-2">Something's not quite right. Want to try again?</p>
                 <button onClick={onRetry} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg text-[13px] text-text-primary self-start hover:bg-bg-primary transition-colors">
                   <RefreshCw size={14} />
                   Retry
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Scroll Pillow */}
      {showScrollPill && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark shadow-md text-[13px] text-text-primary rounded-full z-10 hover:border-accent-primary transition-colors"
        >
          ↓ New message
        </button>
      )}
    </div>
  );
};
