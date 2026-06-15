import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NudgeCard } from './NudgeCard';
import { type Nudge } from '../../store/nudgeStore';
import { fetchWithAuth } from '../../stores/authStore';

export const NudgeStack: React.FC = () => {
  console.error('DEBUG NudgeStack: component called');
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  console.error('DEBUG NudgeStack: registering useEffect');
  useEffect(() => {
    console.error('DEBUG NudgeStack: useEffect callback triggered');
    const loadNudges = async () => {
      console.error('DEBUG NudgeStack: fetch started');
      try {
        const res = await fetchWithAuth('/api/nudges');
        console.error('DEBUG NudgeStack: fetch response status', res.status);
        if (res.ok) {
          const data = await res.json();
          console.error('DEBUG NudgeStack: fetch succeeded, data:', data);
          setNudges(data);
        } else {
          console.error('DEBUG NudgeStack: fetch failed with status', res.status);
        }
      } catch (e) {
        console.error('DEBUG NudgeStack: Failed to load nudges', e);
      } finally {
        setLoading(false);
      }
    };
    loadNudges();
  }, []);

  const handleOpen = async (id: string, courseId: string) => {
    try {
      await fetchWithAuth(`/api/nudges/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      });
      setNudges((prev) => prev.filter((n) => n.id !== id));
      navigate(`/course/${courseId}`);
    } catch (e) {
      console.error('Error handling nudge open', e);
    }
  };

  const handleRemindLater = async (id: string) => {
    try {
      await fetchWithAuth(`/api/nudges/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remind_later' }),
      });
      setNudges((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error('Error handling nudge remind later', e);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetchWithAuth(`/api/nudges/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      });
      setNudges((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error('Error dismissing nudge', e);
    }
  };

  if (loading || nudges.length === 0) return null;

  const visibleNudges = nudges.slice(0, 3);

  return (
    <div className="fixed top-[96px] right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {visibleNudges.map((nudge) => (
          <NudgeCard
            key={nudge.id}
            id={nudge.id}
            courseId={nudge.course_id}
            courseName={nudge.course_name}
            nudgeType={nudge.nudge_type}
            message={nudge.message}
            generatedAt={nudge.generated_at}
            onDismiss={handleDismiss}
            onOpenCourse={handleOpen}
            onRemindLater={handleRemindLater}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
