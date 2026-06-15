import { create } from 'zustand';
import { fetchWithAuth } from '../stores/authStore';

export interface Nudge {
  id: string;
  course_id: string;
  course_name: string;
  nudge_type: 'range_entry' | 'range_stuck' | 'inactivity' | 'goal_behind';
  message: string;
  generated_at: string;
  is_dismissed: boolean;
  email_sent: boolean;
  email_sent_at?: string;
  dismissed_at?: string;
  remind_later_at?: string;
  action_taken?: string;
}

interface NudgeState {
  nudges: Nudge[];
  isLoading: boolean;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  fetchNudges: () => Promise<void>;
  dismissNudge: (id: string) => Promise<void>;
  openCourseNudge: (id: string) => Promise<{ course_id: string; redirect_url: string } | null>;
  remindLaterNudge: (id: string) => Promise<void>;
}

export const useNudgeStore = create<NudgeState>((set, get) => ({
  nudges: [],
  isLoading: false,
  isPanelOpen: false,
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  fetchNudges: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchWithAuth('/api/nudges');
      if (res.ok) {
        const data = await res.json();
        set({ nudges: data });
      }
    } catch (e) {
      console.error('Error fetching nudges', e);
    } finally {
      set({ isLoading: false });
    }
  },
  dismissNudge: async (id) => {
    try {
      const res = await fetchWithAuth(`/api/nudges/${id}/dismiss`, {
        method: 'POST',
      });
      if (res.ok) {
        set((state) => ({
          nudges: state.nudges.filter((n) => n.id !== id),
        }));
      }
    } catch (e) {
      console.error('Error dismissing nudge', e);
    }
  },
  openCourseNudge: async (id) => {
    try {
      const res = await fetchWithAuth(`/api/nudges/${id}/open-course`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          nudges: state.nudges.filter((n) => n.id !== id),
        }));
        return data; // { course_id, redirect_url }
      }
    } catch (e) {
      console.error('Error opening course nudge', e);
    }
    return null;
  },
  remindLaterNudge: async (id) => {
    try {
      const res = await fetchWithAuth(`/api/nudges/${id}/remind-later`, {
        method: 'POST',
      });
      if (res.ok) {
        set((state) => ({
          nudges: state.nudges.filter((n) => n.id !== id),
        }));
      }
    } catch (e) {
      console.error('Error setting remind later for nudge', e);
    }
  },
}));
