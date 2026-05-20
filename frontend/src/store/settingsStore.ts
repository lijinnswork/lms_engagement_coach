import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SettingsStore {
  // Coach
  coachFrequency: number          // 1–7, default 3
  coachTone: 'warm' | 'balanced' | 'brief'
  goalProposalsEnabled: boolean   // default true
  coachDisabled: boolean          // default false

  // Notifications
  quietStart: string              // "22:00"
  quietEnd: string                // "08:00"
  inAppEnabled: boolean           // default true
  emailSummaryEnabled: boolean    // default false
  maxMessagesPerWeek: number      // 1–7, default 3

  // Learning
  studyTime: 'morning' | 'afternoon' | 'evening' | 'night'
  goalStyle: 'weekly' | 'milestone' | 'open'

  // Privacy
  notificationEmail: boolean
  notificationPush: boolean

  // Appearance
  theme: 'light' | 'dark' | 'system'
  fontSize: 'default' | 'large'
  reduceMotion: boolean           // default false

  // Actions
  set: (partial: Partial<SettingsStore>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Coach
      coachFrequency: 3,
      coachTone: 'warm',
      goalProposalsEnabled: true,
      coachDisabled: false,

      // Notifications
      quietStart: '22:00',
      quietEnd: '08:00',
      inAppEnabled: true,
      emailSummaryEnabled: false,
      maxMessagesPerWeek: 3,

      // Learning
      studyTime: 'evening',
      goalStyle: 'weekly',

      // Notifications
      notificationEmail: true,
      notificationPush: true,

      // Appearance
      theme: 'system',
      fontSize: 'default',
      reduceMotion: false,

      // Actions
      set: (partial) => set(partial),
    }),
    {
      name: 'learner-settings', // unique name for localStorage key
    }
  )
)
