import React, { useState } from 'react';
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
  
  const { suggestions } = useRemindersStore();

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

          {suggestions.length > 0 && (
            <CoachSuggestions onEdit={handleOpenModal} />
          )}

          <AssessmentReminders />

          <RemindersList onEdit={handleOpenModal} />

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
