import React, { useState, useEffect, useRef } from 'react';
import { useCoachStore } from '../../store/coachStore';
import { Plus, Search, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CoachSidebar = () => {
  const {
    conversations,
    conversationId,
    createNewConversation,
    switchConversation,
    renameConversation,
    deleteConversation,
    fetchConversations
  } = useCoachStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle || '');
  };

  const handleSaveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat? This cannot be undone.")) {
      await deleteConversation(id);
    }
  };

  // Group conversations by date
  const getGroupLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    // Reset hours for day comparisons
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = dToday.getTime() - dDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return "Previous 7 Days";
    return "Older Chats";
  };

  const filteredConversations = conversations.filter(c => {
    const summary = c.summary || '';
    return summary.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Grouping
  const groups: { [key: string]: any[] } = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older Chats": []
  };

  filteredConversations.forEach(c => {
    const label = getGroupLabel(c.started_at);
    if (groups[label]) {
      groups[label].push(c);
    } else {
      groups["Older Chats"].push(c);
    }
  });

  return (
    <div className="w-[280px] shrink-0 h-full bg-bg-secondary/40 dark:bg-bg-darkCard/30 border-r border-border-light dark:border-border-dark/50 flex flex-col overflow-hidden backdrop-blur-sm">
      {/* Sidebar Header */}
      <div className="p-4 flex flex-col gap-3 border-b border-border-light dark:border-border-dark/50 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-serif text-[18px] font-bold text-text-primary dark:text-text-darkPri">Chats</span>
          <button 
            onClick={() => createNewConversation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-sage text-white text-[11px] font-sans font-medium hover:bg-accent-sage/90 transition-colors shadow-sm"
          >
            <Plus size={14} />
            New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 border border-border-light dark:border-border-dark rounded-xl px-3 py-1.5 bg-bg-primary/50 dark:bg-bg-dark/50 focus-within:border-accent-sage/50 transition-colors">
          <Search size={14} className="text-text-secondary dark:text-text-darkSec" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[12px] text-text-primary dark:text-text-darkPri focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5 hidden-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-text-secondary dark:text-text-darkSec text-[11px] py-8">
            {searchQuery ? "No conversations match search." : "No conversations yet."}
          </div>
        ) : (
          Object.keys(groups).map(groupLabel => {
            const items = groups[groupLabel];
            if (items.length === 0) return null;

            return (
              <div key={groupLabel} className="flex flex-col gap-1 shrink-0">
                <span className="text-[10px] font-sans font-semibold text-text-secondary dark:text-text-darkSec uppercase tracking-wider px-2 mb-1">
                  {groupLabel}
                </span>

                <div className="flex flex-col gap-0.5">
                  <AnimatePresence initial={false}>
                    {items.map(c => {
                      const isActive = conversationId === c.id;
                      const displayTitle = c.summary && c.summary !== "New Chat"
                        ? c.summary
                        : `Chat — ${new Date(c.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

                      return (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={`group flex items-center justify-between rounded-xl px-2.5 py-2 cursor-pointer transition-colors relative ${isActive ? 'bg-accent-sage/10 dark:bg-accent-sage/15 border-l-2 border-accent-sage pl-2' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                          onClick={() => switchConversation(c.id)}
                          onDoubleClick={() => handleStartRename(c.id, c.summary)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                            <MessageSquare size={14} className={isActive ? 'text-accent-sage' : 'text-text-secondary dark:text-text-darkSec'} />
                            {editingId === c.id ? (
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={() => handleSaveRename(c.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(c.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-bg-primary dark:bg-bg-dark border border-accent-sage rounded px-1 py-0.5 text-[12px] text-text-primary dark:text-text-darkPri focus:outline-none w-full"
                              />
                            ) : (
                              <span className={`text-[12px] font-sans truncate ${isActive ? 'text-text-primary dark:text-text-darkPri font-medium' : 'text-text-secondary dark:text-text-darkSec group-hover:text-text-primary dark:group-hover:text-text-darkPri'}`}>
                                {displayTitle}
                              </span>
                            )}
                          </div>

                          {/* Delete button (shows on hover) */}
                          {editingId !== c.id && (
                            <button
                              onClick={(e) => handleDelete(e, c.id)}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-text-secondary dark:text-text-darkSec transition-all p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                              title="Delete conversation"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
