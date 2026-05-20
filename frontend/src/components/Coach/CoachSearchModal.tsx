import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import type { CoachMessageProps } from './CoachMessageBubble';

interface CoachSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export const CoachSearchModal: React.FC<CoachSearchModalProps> = ({ isOpen, onClose, conversationId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoachMessageProps[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim() || !conversationId) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/coach/messages/search?q=${encodeURIComponent(query)}&conversation_id=${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
            timestamp: new Date(m.created_at).toLocaleDateString()
          }));
          setResults(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, conversationId]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full md:w-[600px] max-h-[80vh] bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            >
            <div className="flex items-center p-4 border-b border-border-light dark:border-border-dark shrink-0 gap-3 bg-bg-secondary dark:bg-bg-darkCard">
              <Search size={20} className="text-text-secondary" />
              <input 
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search conversation..."
                className="flex-1 bg-transparent border-none outline-none text-[16px] text-text-primary placeholder:text-text-secondary w-full"
              />
              <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 hidden-scrollbar min-h-[300px]">
              {isSearching ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full" /></div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {results.map(msg => (
                    <div key={msg.id} onClick={onClose} className="p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-accent-primary transition-colors cursor-pointer bg-bg-secondary dark:bg-bg-darkCard">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[12px] font-bold text-accent-sage uppercase tracking-wider">{msg.sender}</span>
                         <span className="text-[11px] text-text-secondary">{msg.timestamp}</span>
                      </div>
                      <p className="text-[14px] text-text-primary line-clamp-3">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-80">
                  <p className="text-text-secondary text-center">No results found for "{query}"</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-80">
                  <Search size={32} className="text-text-secondary/50 mb-4" />
                  <p className="text-text-secondary text-center max-w-[250px]">
                    Search your past conversations and reflections securely.
                  </p>
                </div>
              )}
            </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
