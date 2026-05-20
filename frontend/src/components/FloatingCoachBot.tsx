import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, Send } from 'lucide-react';
import { useCoachStore } from '../store/coachStore';
import { AnimatePresence, motion } from 'framer-motion';

export const FloatingCoachBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { 
    messages, 
    isTyping, 
    timeoutError, 
    initConversation, 
    sendMessage,
    conversationId
  } = useCoachStore();

  // Initialize if not already
  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen, conversationId, initConversation]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;
    const textToSend = input;
    setInput('');
    await sendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Hidden on specific routes where it doesn't belong or we already have the full UI
  if (
    location.pathname.startsWith('/coach') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] bg-white dark:bg-bg-darkCard rounded-2xl shadow-xl border border-border-light dark:border-border-dark flex flex-col overflow-hidden"
            style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-coach-dark/10 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-coach-dark flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">AI Coach</h3>
                  <p className="text-[11px] text-text-secondary">Always here to help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-text-secondary hover:bg-black/5 hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-bg-primary dark:bg-bg-dark">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-70">
                   <Bot size={32} className="mb-2 text-coach-dark" />
                   <p className="text-sm font-serif italic text-center px-4">I'm your AI Coach. How are you feeling today?</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCoach = msg.sender === 'coach';
                  return (
                    <div key={msg.id} className={`flex ${isCoach ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${
                        isCoach 
                          ? 'bg-[#F5F0EB] dark:bg-[#2A2E3A] rounded-tl-sm' 
                          : 'bg-accent-sage/15 dark:bg-accent-sage/20 rounded-tr-sm'
                      }`}>
                        <p className={`text-[13px] leading-relaxed text-text-primary ${isCoach ? 'font-serif italic' : 'font-sans'}`}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && !timeoutError && (
                 <div className="flex justify-start">
                   <div className="bg-[#F5F0EB] dark:bg-[#2A2E3A] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
                      <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                 </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-bg-secondary dark:bg-bg-darkCard border-t border-border-light dark:border-border-dark flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isTyping ? "Coach is typing..." : "Type your message..."}
                disabled={isTyping}
                className="flex-1 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-full px-4 py-2 text-[14px] text-text-primary focus:outline-none focus:border-coach-dark"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-[36px] h-[36px] shrink-0 bg-coach-dark text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:brightness-105 transition-all"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-coach-dark text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Bot size={28} />
      </button>
    </div>
  );
};
