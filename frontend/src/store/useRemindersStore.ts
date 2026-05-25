import { create } from 'zustand';
import { fetchWithAuth } from '../stores/authStore';

interface Reminder {
  id: string;
  title: string;
  reminder_type: string;
  date: string;
  time: string;
  status: string;
}

interface RemindersStore {
  reminders: Record<string, Reminder[]>;
  suggestions: any[];
  assessments: Record<string, any[]>;
  fetchReminders: () => Promise<void>;
  pendingCount: number;
}

export const useRemindersStore = create<RemindersStore>((set) => ({
  reminders: { today: [], tomorrow: [], week: [], later: [], completed: [] },
  suggestions: [],
  assessments: { overdue: [], today: [], tomorrow: [], this_week: [] },
  pendingCount: 0,
  fetchReminders: async () => {
    try {
      // 1. Fetch user reminders
      const remindersRes = await fetchWithAuth('/api/reminders');
      let reminders = { today: [], tomorrow: [], week: [], later: [], completed: [] };
      if (remindersRes.ok) {
        reminders = await remindersRes.json();
      }

      // 2. Fetch coach reminder suggestions
      const suggestionsRes = await fetchWithAuth('/api/reminders/suggestions');
      let suggestions = [];
      if (suggestionsRes.ok) {
        suggestions = await suggestionsRes.json();
      }

      // 3. Fetch LMS upcoming assignments
      const assessmentsRes = await fetchWithAuth('/api/courses/upcoming-assignments');
      let assessments = { overdue: [], today: [], tomorrow: [], this_week: [] };
      if (assessmentsRes.ok) {
        assessments = await assessmentsRes.json();
      }

      // Calculate total pending actionable items shown on the screen
      const pendingCount = 
        (reminders.today?.length || 0) + 
        (suggestions?.length || 0) + 
        (assessments.overdue?.length || 0) + 
        (assessments.today?.length || 0) + 
        (assessments.tomorrow?.length || 0) + 
        (assessments.this_week?.length || 0);

      set({
        reminders,
        suggestions,
        assessments,
        pendingCount
      });
    } catch (e) {
      console.error("Failed to fetch reminders and assignments", e);
    }
  }
}));

