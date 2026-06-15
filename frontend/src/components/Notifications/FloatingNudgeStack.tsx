import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FloatingNudgeCard } from './FloatingNudgeCard';
import { useNudgeStore, type Nudge } from '../../store/nudgeStore';
import { useNavigate } from 'react-router-dom';

interface FloatingNudgeStackProps {
  nudges?: Nudge[];
  onOpenPanel?: () => void;
}

export const FloatingNudgeStack: React.FC<FloatingNudgeStackProps> = ({
  nudges: propNudges,
  onOpenPanel,
}) => {
  const store = useNudgeStore();
  const navigate = useNavigate();

  // Fetch nudges on mount
  useEffect(() => {
    store.fetchNudges();
  }, []);

  const activeNudges = propNudges !== undefined ? propNudges : store.nudges;

  if (activeNudges.length === 0) return null;

  const visibleNudges = activeNudges.slice(0, 3);
  const remainingCount = activeNudges.length - 3;

  const handleOpenCourse = async (id: string, courseId: string) => {
    const result = await store.openCourseNudge(id);
    if (result && result.redirect_url) {
      navigate(result.redirect_url);
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  const handleOpenClick = () => {
    if (onOpenPanel) {
      onOpenPanel();
    } else {
      store.setPanelOpen(true);
    }
  };

  return (
    <div className="fixed top-[96px] right-4 z-[100] flex flex-col gap-2 pointer-events-none select-none">
      <AnimatePresence mode="popLayout">
        {visibleNudges.map((nudge, index) => (
          <FloatingNudgeCard
            key={nudge.id}
            id={nudge.id}
            courseId={nudge.course_id}
            courseName={nudge.course_name}
            nudgeType={nudge.nudge_type}
            message={nudge.message}
            generatedAt={nudge.generated_at}
            index={index}
            onDismiss={store.dismissNudge}
            onOpenCourse={handleOpenCourse}
            onRemindLater={store.remindLaterNudge}
          />
        ))}

        {remainingCount > 0 && (
          <motion.button
            key="overflow-card"
            layout
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={handleOpenClick}
            className="w-[280px] rounded-[10px] p-3.5 border border-dashed border-[#7B9EA8] bg-[#7B9EA8]/8 text-left flex flex-col gap-1 cursor-pointer pointer-events-auto hover:bg-[#7B9EA8]/12 transition-colors select-none"
            style={{ borderColor: '#7B9EA8', borderWidth: '1px', borderStyle: 'dashed' }}
          >
            <div className="text-[13px] font-semibold font-sans text-[#7B9EA8]">
              + {remainingCount} more {remainingCount === 1 ? 'nudge' : 'nudges'}
            </div>
            <div className="text-[11px] font-sans text-[#7B9EA8] opacity-90">
              Tap to see all notifications →
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
