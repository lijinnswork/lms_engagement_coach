import { create } from 'zustand'
import { mockGoals } from '../data/mockDashboard'

interface DashboardStore {
  // Coach card
  coachCardVisible: boolean
  replyOpen: boolean
  replyText: string
  dismissCoachCard: () => void
  toggleReply: () => void
  setReplyText: (text: string) => void

  // Goals
  goals: any[]
  setGoals: (goals: any[]) => void
  toggleGoalDone: (id: string) => void

  // Engagement
  engagementMetrics: { metrics: any, summary: string } | null
  fetchEngagementMetrics: () => Promise<void>

  // Settings Panel
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // Account Panel
  isAccountOpen: boolean
  setAccountOpen: (open: boolean) => void

  // Sidebar visibility
  sidebarVisible: boolean
  setSidebarVisible: (visible: boolean) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Coach card
  coachCardVisible: true,
  replyOpen: false,
  replyText: '',
  dismissCoachCard: () => set({ coachCardVisible: false }),
  toggleReply: () => set((state) => ({ replyOpen: !state.replyOpen })),
  setReplyText: (text: string) => set({ replyText: text }),

  // Goals
  goals: mockGoals as any[],
  setGoals: (goals) => set({ goals }),
  toggleGoalDone: (id) => {
    set((state) => {
      const goalToUpdate = state.goals.find(g => g.id === id);
      if (!goalToUpdate) return state;
      
      const newDone = goalToUpdate.status ? goalToUpdate.status !== 'completed' : !goalToUpdate.done;
      const newStatus = newDone ? 'completed' : 'active';
      
      // Fire API call if it's a real backend goal
      if (goalToUpdate.status !== undefined) {
        fetch(`/api/goals/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).catch(e => console.error(e));
      }

      return {
        goals: state.goals.map((g) => {
          if (g.id === id) {
            return {
              ...g,
              done: newDone,
              status: g.status ? newStatus : g.status
            };
          }
          return g;
        })
      };
    });
  },

  // Engagement
  engagementMetrics: null,
  fetchEngagementMetrics: async () => {
    const fallbackMetrics = {
      metrics: { focus: 0, consistency: 0, mastery: 0, curiosity: 0, pacing: 0 },
      summary: "Connect to the API to see your engagement data."
    };
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ engagementMetrics: fallbackMetrics });
        return;
      }
      const res = await fetch('/api/dashboard/engagement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ engagementMetrics: data });
      } else {
        set({ engagementMetrics: fallbackMetrics });
      }
    } catch (e) {
      console.error("Failed to fetch engagement metrics", e);
      set({ engagementMetrics: fallbackMetrics });
    }
  },

  // Settings
  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open, isAccountOpen: false }),

  // Account
  isAccountOpen: false,
  setAccountOpen: (open) => set({ isAccountOpen: open, isSettingsOpen: false }),

  // Sidebar
  sidebarVisible: true,
  setSidebarVisible: (visible) => set({ sidebarVisible: visible })
}))
