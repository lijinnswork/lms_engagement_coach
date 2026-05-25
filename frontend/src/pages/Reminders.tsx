import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { CoachSuggestions } from '../components/Reminders/CoachSuggestions';
import { RemindersList } from '../components/Reminders/RemindersList';
import { AssessmentReminders } from '../components/Reminders/AssessmentReminders';
import { ReminderModal } from '../components/Reminders/ReminderModal';
import { useRemindersStore } from '../store/useRemindersStore';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { MobileLayout } from '../layouts/MobileLayout';

export const Reminders: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const breakpoint = useBreakpoint();
  
  const { fetchReminders, reminders, assessments, suggestions } = useRemindersStore();

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleOpenModal = (reminder?: any) => {
    setEditingReminder(reminder || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-[var(--bg-app)] pb-20 md:pb-0 w-full"
    >
      <div className="flex-1 overflow-y-auto px-6 pt-0 pb-12">
        <div className="max-w-5xl space-y-8 w-full">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Reminders</h1>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1 font-medium">Manage your study schedule and deadlines.</p>
            </div>
            
            <button 
              onClick={() => handleOpenModal()}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--coach-primary)] text-white rounded-full font-medium text-[13px] hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={16} />
              New Reminder
            </button>
          </div>

          {(!reminders.today?.length && !reminders.tomorrow?.length && !reminders.week?.length && !reminders.later?.length && !reminders.completed?.length && !assessments.overdue?.length && !assessments.today?.length && !assessments.tomorrow?.length && !assessments.this_week?.length && suggestions.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--bg-surface)] rounded-[24px] border border-dashed border-[var(--border-light)] dark:border-[var(--border-dark)] p-8">
              <p className="text-[14px] text-[var(--text-secondary)] mb-4 max-w-[320px] leading-relaxed font-sans font-medium">
                No reminders set yet. Create a reminder to stay on track, or let your coach suggest some based on your schedule.
              </p>
              <button 
                onClick={() => handleOpenModal()}
                className="px-6 py-2 bg-[var(--coach-primary)] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                + Create a reminder
              </button>
            </div>
          ) : (
            <>
              {suggestions.length > 0 && (
                <CoachSuggestions onEdit={handleOpenModal} />
              )}

              <AssessmentReminders />

              <RemindersList onEdit={handleOpenModal} />
            </>
          )}

        </div>
      </div>

      {/* Mobile FAB */}
      <button 
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[var(--coach-primary)] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      <ReminderModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={editingReminder} 
      />
    </motion.div>
  );

  if (breakpoint === 'desktop') return <DesktopLayout>{content}</DesktopLayout>;
  if (breakpoint === 'tablet') return <TabletLayout>{content}</TabletLayout>;
  return <MobileLayout>{content}</MobileLayout>;
};
