import React, { useState, useEffect } from 'react';
import { CoachChatHeader } from './CoachChatHeader';
import { CoachMessageList } from './CoachMessageList';
import { CoachInputBar } from './CoachInputBar';
import { CoachNotesModal } from './CoachNotesModal';
import { CoachSearchModal } from './CoachSearchModal';
import { useCoachStore } from '../../store/coachStore';
import { useDashboardStore } from '../../store/dashboardStore';

export const CoachChatInterface: React.FC = () => {
  const { 
    messages, 
    conversationId, 
    isTyping, 
    timeoutError, 
    setTimeoutError, 
    initConversation, 
    sendMessage 
  } = useCoachStore();
  
  const [input, setInput] = useState('');
  
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize conversation
  useEffect(() => {
    if (!conversationId) {
      initConversation();
    }
  }, [conversationId, initConversation]);

  // Check if we arrived with a reply message from the home page Coach Card
  useEffect(() => {
    const checkAndSendHomeReply = async () => {
      // Access store state directly to avoid duplicate executions due to StrictMode closures
      const currentReplyText = useDashboardStore.getState().replyText;
      if (conversationId && currentReplyText.trim()) {
        useDashboardStore.getState().setReplyText(''); // Clear synchronously immediately
        await sendMessage(currentReplyText);
      }
    };
    checkAndSendHomeReply();
  }, [conversationId, sendMessage]);

  const handleSend = async (forcedText?: string, _contextTag?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim()) return;

    if (!conversationId) {
      setTimeoutError(true);
      return;
    }

    setInput('');
    await sendMessage(textToSend);
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary dark:bg-bg-dark overflow-hidden">
      <CoachChatHeader 
        onSearchClick={() => setIsSearchOpen(true)} 
        onNotesClick={() => setIsNotesOpen(true)} 
      />
      <CoachMessageList 
        messages={messages} 
        isTyping={isTyping} 
        timeoutError={timeoutError}
        onRetry={async () => {
          setTimeoutError(false);
          // Simple retry could re-trigger last message, but for now just clear error
        }}
      />
      <CoachInputBar 
        input={input} 
        setInput={setInput} 
        onSend={handleSend} 
        isTyping={isTyping} 
      />

      <CoachNotesModal isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
      <CoachSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} conversationId={conversationId} />
    </div>
  );
};
