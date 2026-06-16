import { create } from 'zustand'
import { fetchWithAuth } from '../stores/authStore'


interface DashboardStore {
  // Courses
  courses: any[] | null
  coursesLoading: boolean
  fetchCourses: (force?: boolean) => Promise<void>
  clearCourses: () => void

  // Coach card
  coachCardVisible: boolean
  replyOpen: boolean
  replyText: string
  coachGreeting: string
  fetchCoachGreeting: () => Promise<void>
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

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Courses
  courses: null,
  coursesLoading: false,
  fetchCourses: async (force = false) => {
    const state = get();
    if (!force && state.courses !== null) return;
    
    set({ coursesLoading: true });
    try {
      const res = await fetchWithAuth('/api/courses');
      if (res.ok) {
        const data = await res.json();
        set({ courses: data });
      } else {
        set({ courses: [] });
      }
    } catch (e) {
      console.error("Failed to fetch courses", e);
      set({ courses: [] });
    } finally {
      set({ coursesLoading: false });
    }
  },
  clearCourses: () => set({ courses: null }),

  // Coach card
  coachCardVisible: true,
  replyOpen: false,
  replyText: '',
  coachGreeting: "I'm keeping track of your learning rhythm and goals. Let me know if you want to chat about your progress!",
  fetchCoachGreeting: async () => {
    try {
      const res = await fetchWithAuth('/api/coach/latest-greeting');
      if (res.ok) {
        const data = await res.json();
        if (data && data.message) {
          set({ coachGreeting: data.message });
        }
      }
    } catch (e) {
      console.error("Failed to fetch coach greeting", e);
    }
  },
  dismissCoachCard: () => set({ coachCardVisible: false }),
  toggleReply: () => set((state) => ({ replyOpen: !state.replyOpen })),
  setReplyText: (text: string) => set({ replyText: text }),

  // Goals
  goals: [],
  setGoals: (goals) => set({ goals }),
  toggleGoalDone: (id) => {
    set((state) => {
      const goalToUpdate = state.goals.find(g => g.id === id);
      if (!goalToUpdate) return state;
      
      const newDone = goalToUpdate.status ? goalToUpdate.status !== 'completed' : !goalToUpdate.done;
      const newStatus = newDone ? 'completed' : 'active';
      
      // Fire API call if it's a real backend goal
      if (goalToUpdate.status !== undefined) {
        fetchWithAuth(`/api/goals/${id}`, {
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
      const res = await fetchWithAuth('/api/dashboard/engagement');
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
