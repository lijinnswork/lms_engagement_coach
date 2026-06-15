import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NudgeCard } from './NudgeCard';
import { useNudgeStore } from '../../store/nudgeStore';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { nudges, fetchNudges, dismissNudge, openCourseNudge, remindLaterNudge, isLoading } = useNudgeStore();
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Handle mobile breakpoint check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard support: Escape closes panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch nudges when opening
  useEffect(() => {
    if (isOpen) {
      fetchNudges();
    }
  }, [isOpen, fetchNudges]);

  const handleOpenCourse = async (id: string, courseId: string) => {
    const result = await openCourseNudge(id);
    onClose();
    if (result && result.redirect_url) {
      navigate(result.redirect_url);
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  // Mobile variants
  const panelVariants = isMobile
    ? {
        hidden: { translateY: '100%' },
        visible: { translateY: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
        exit: { translateY: '100%', transition: { duration: 0.3, ease: 'easeIn' as const } },
      }
    : {
        hidden: { translateX: '100%' },
        visible: { translateX: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
        exit: { translateX: '100%', transition: { duration: 0.3, ease: 'easeIn' as const } },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isOpen ? 0.3 : 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[150]"
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed bg-[var(--bg-secondary)] border-[var(--border-light)] dark:border-[var(--border-dark)] shadow-2xl z-[200] flex flex-col overflow-hidden ${
              isMobile
                ? 'bottom-0 left-0 right-0 w-full h-[85vh] rounded-t-2xl border-t'
                : 'top-0 right-0 w-[360px] h-screen border-l'
            }`}
          >
            {/* Header (sticky) */}
            <div className="h-[56px] border-b border-[var(--border-light)] dark:border-[var(--border-dark)] flex items-center justify-between px-6 bg-[var(--bg-secondary)] shrink-0 z-10">
              <h2 className="text-[16px] font-bold font-sans text-[var(--text-primary)] dark:text-[var(--text-darkPri)] tracking-tight">
                Notifications
              </h2>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-darkPri)] p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content (scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-5 hidden-scrollbar">
              {isLoading ? (
                /* Skeleton Loader */
                <div className="flex flex-col gap-4">
                  <div className="h-4 w-24 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-full h-[140px] bg-black/5 dark:bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : nudges.length > 0 ? (
                <>
                  <div className="text-[12px] font-bold font-sans uppercase tracking-wider text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] mb-4 select-none">
                    Pending ({nudges.length})
                  </div>
                  <div className="flex flex-col">
                    <AnimatePresence mode="popLayout">
                      {nudges.map((nudge) => (
                        <NudgeCard
                          key={nudge.id}
                          id={nudge.id}
                          courseId={nudge.course_id}
                          courseName={nudge.course_name}
                          nudgeType={nudge.nudge_type}
                          message={nudge.message}
                          generatedAt={nudge.generated_at}
                          onDismiss={dismissNudge}
                          onOpenCourse={handleOpenCourse}
                          onRemindLater={remindLaterNudge}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  {/* Waving hand SVG (static in empty state) */}
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-text-secondary, #6B6778)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mb-4 opacity-70"
                  >
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                  </svg>
                  <h3 className="text-[16px] font-bold font-sans text-[var(--text-primary)] dark:text-[var(--text-darkPri)] mb-1">
                    You are all caught up
                  </h3>
                  <p className="text-[14px] font-sans text-[var(--text-secondary)] dark:text-[var(--text-darkSec)] max-w-[220px] leading-relaxed">
                    No nudges right now. We will let you know when something needs your attention.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
