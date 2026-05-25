import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Repeat, Save } from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';
import { useRemindersStore } from '../../store/useRemindersStore';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, initialData }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState('none');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialData) {
        setTitle(initialData.title || initialData.suggested_title || '');
        setDate(initialData.date || initialData.suggested_date || new Date().toISOString().split('T')[0]);
        setTime(initialData.time || initialData.suggested_time || '09:00');
        setRepeat(initialData.repeat || 'none');
        setNotes(initialData.notes || '');
      } else {
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('09:00');
        setRepeat('none');
        setNotes('');
      }
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setErrorMsg(null);

    try {
      let res;
      if (initialData && initialData.id && !initialData.suggested_title) {
        res = await fetchWithAuth(`/api/reminders/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            date,
            time,
            repeat,
            notes
          })
        });
      } else {
        res = await fetchWithAuth('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            reminder_type: 'custom',
            date,
            time,
            repeat,
            notes
          })
        });

        if (initialData && initialData.suggested_title && initialData.id) {
          await fetchWithAuth(`/api/reminders/suggestions/${initialData.id}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              reminder_type: 'custom',
              date,
              time,
              repeat,
              notes
            })
          });
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to save reminder' }));
        throw new Error(errData.detail || 'Failed to save reminder');
      }

      useRemindersStore.getState().fetchReminders();
      onClose();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to save reminder. Please check your fields.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-[24px] shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)] dark:border-[var(--border-dark)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {initialData ? 'Edit Reminder' : 'New Reminder'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-secondary)]">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to be reminded about?"
                className="w-full bg-[var(--bg-app)] border border-[var(--border-light)] dark:border-[var(--border-dark)] rounded-[12px] px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--coach-primary)] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Date
                </label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-light)] dark:border-[var(--border-dark)] rounded-[12px] px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--coach-primary)] transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Clock size={14} /> Time
                </label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-light)] dark:border-[var(--border-dark)] rounded-[12px] px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--coach-primary)] transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                <Repeat size={14} /> Repeat
              </label>
              <select 
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-light)] dark:border-[var(--border-dark)] rounded-[12px] px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--coach-primary)] transition-colors appearance-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={3}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-light)] dark:border-[var(--border-dark)] rounded-[12px] px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--coach-primary)] transition-colors resize-none"
              />
            </div>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] rounded-xl px-4 py-2 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}
          </div>

          <div className="p-6 bg-[var(--bg-app)] flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!title}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--coach-primary)] text-white rounded-full text-[14px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={16} />
              Save Reminder
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
