import { create } from 'zustand';
import type { CoachMessageProps } from '../components/Coach/CoachMessageBubble';
import { fetchWithAuth } from '../stores/authStore';


interface CoachStore {
  messages: CoachMessageProps[];
  conversations: any[];
  conversationId: string | null;
  isTyping: boolean;
  timeoutError: boolean;
  initError: boolean;
  
  setMessages: (messages: CoachMessageProps[]) => void;
  setConversations: (conversations: any[]) => void;
  setConversationId: (id: string | null) => void;
  setIsTyping: (isTyping: boolean) => void;
  setTimeoutError: (error: boolean) => void;

  initConversation: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  createNewConversation: () => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  fetchMessages: (cId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
}

export const useCoachStore = create<CoachStore>((set, get) => ({
  messages: [],
  conversations: [],
  conversationId: null,
  isTyping: false,
  timeoutError: false,
  initError: false,

  setMessages: (messages) => set({ messages }),
  setConversations: (conversations) => set({ conversations }),
  setConversationId: (id) => set({ conversationId: id }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setTimeoutError: (error) => set({ timeoutError: error }),

  fetchConversations: async () => {
    try {
      const res = await fetchWithAuth('/api/coach/conversations');
      if (res.ok) {
        const data = await res.json();
        set({ conversations: data });
      }
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  },

  createNewConversation: async () => {
    try {
      const res = await fetchWithAuth('/api/coach/conversations', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({ conversations: [data, ...state.conversations] }));
        get().switchConversation(data.id);
      }
    } catch (e) {
      console.error("Failed to create conversation", e);
    }
  },

  renameConversation: async (id: string, newTitle: string) => {
    try {
      const res = await fetchWithAuth(`/api/coach/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        set((state) => ({
          conversations: state.conversations.map(c => c.id === id ? { ...c, summary: newTitle } : c)
        }));
      }
    } catch (e) {
      console.error("Failed to rename conversation", e);
    }
  },

  deleteConversation: async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/coach/conversations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        set((state) => {
          const nextConversations = state.conversations.filter(c => c.id !== id);
          let nextId = state.conversationId;
          if (state.conversationId === id) {
            nextId = nextConversations.length > 0 ? nextConversations[0].id : null;
          }
          return {
            conversations: nextConversations,
            conversationId: nextId
          };
        });
        const nextId = get().conversationId;
        if (nextId) {
          await get().switchConversation(nextId);
        } else {
          set({ messages: [] });
        }
      }
    } catch (e) {
      console.error("Failed to delete conversation", e);
    }
  },

  switchConversation: async (id: string) => {
    set({ conversationId: id, messages: [] });
    await get().fetchMessages(id);
  },

  initConversation: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetchWithAuth('/api/coach/conversations');
      if (res.ok) {
        const data = await res.json();
        set({ conversations: data, initError: false });
        if (data && data.length > 0) {
          const cId = data[0].id;
          set({ conversationId: cId });
          await get().fetchMessages(cId);
        }
      } else {
        set({ initError: true });
      }
    } catch (e) {
      console.error("Failed to init convo", e);
      set({ initError: true });
    }
  },

  fetchMessages: async (cId: string) => {
    try {
      const res = await fetchWithAuth(`/api/coach/messages?conversation_id=${cId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: CoachMessageProps[] = data.items.map((m: any) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          created_at: m.created_at
        })).reverse();
        set({ messages: mapped });
      }
    } catch (e) {
      console.error(e);
    }
  },

  sendMessage: async (text: string) => {
    const { conversationId, messages } = get();
    if (!text.trim() || !conversationId) return;

    const optimisticId = Date.now().toString();
    const newUserMsg: CoachMessageProps = { 
      id: optimisticId, 
      sender: 'student', 
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    };

    set({ 
      messages: [...messages, newUserMsg],
      isTyping: true,
      timeoutError: false
    });

    try {
      const response = await fetchWithAuth('/api/coach/message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: text, 
          conversation_id: conversationId,
          message_type: 'reply'
        })
      });
      
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      set((state) => ({
        messages: [...state.messages, {
          id: data.id,
          sender: 'coach',
          content: data.content,
          timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          created_at: data.created_at
        }],
        isTyping: false
      }));
    } catch(err) {
       console.error(err);
       set({ timeoutError: true, isTyping: false });
    }
  }
}));
