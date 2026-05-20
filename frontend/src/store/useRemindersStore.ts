import { create } from 'zustand';

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
    // In real app, fetch from API. Mocking for now.
    const reminders = {
      today: [
        { id: '1', title: 'Calculus Assignment', reminder_type: 'assignment_deadline', date: new Date().toISOString(), time: '18:00', status: 'active' }
      ],
      tomorrow: [],
      week: [],
      later: [],
      completed: []
    };
    
    const suggestions = [
      {
        id: 's1',
        suggested_title: 'Study Session for Linear Algebra',
        suggested_type: 'study_session',
        suggested_date: new Date().toISOString(),
        suggested_time: '19:00',
        reasoning: 'Your pacing is behind, and you have no sessions planned.',
        status: 'pending'
      }
    ];

    const assessments = {
      overdue: [
        { id: 'a1', name: 'Python Quiz 2', course_name: 'Python Fundamentals', status: 'Was due Apr 18' }
      ],
      today: [
        { id: 'a2', name: 'UX Design Assignment 2', course_name: 'UX Design Foundations', status: 'Due by 11:59 PM' }
      ],
      tomorrow: [
        { id: 'a3', name: 'Data Science Quiz 3', course_name: 'Data Science Basics', status: 'Due by 5:00 PM' }
      ],
      this_week: [
        { id: 'a4', name: 'Python Fundamentals Lab 4', course_name: 'Python Fundamentals', status: 'Fri, Apr 25' }
      ]
    };

    // Calculate total pending actionable items shown on the screen
    const pendingCount = 
      reminders.today.length + 
      suggestions.length + 
      assessments.overdue.length + 
      assessments.today.length + 
      assessments.tomorrow.length + 
      assessments.this_week.length;

    set({
      reminders,
      suggestions,
      assessments,
      pendingCount
    });
  }
}));
