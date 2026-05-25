import { motion } from 'framer-motion';
import React from 'react';
import { Home, MessageSquare, Target, Settings, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

import { CoachCard } from '../components/dashboard/CoachCard';
import { NextActionCard } from '../components/dashboard/NextActionCard';
import { GoalsList } from '../components/dashboard/GoalsList';
import { AnnouncementBanner } from '../components/dashboard/AnnouncementBanner';
import { UpcomingDue } from '../components/dashboard/UpcomingDue';
import { StackedProgressBar } from '../components/dashboard/StackedProgressBar';
import { CourseCardsTabs } from '../components/dashboard/CourseCardsTabs';
import { useRemindersStore } from '../store/useRemindersStore';
import { LearningRhythm } from '../components/dashboard/LearningRhythm';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 }
  }
};

const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } }
};

interface MobileLayoutProps {
  children?: React.ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { pendingCount, fetchReminders } = useRemindersStore();
  const [enrolledCourses, setEnrolledCourses] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEnrolledCourses(data);
        }
      })
      .catch(e => console.error(e));
  }, []);

  const inProgress = enrolledCourses.filter((c: any) => {
    const progressPercent = c.progress_percent ?? c.progress ?? 0;
    return progressPercent < 100;
  });
  
  const bestCourse = inProgress.sort((a: any, b: any) => {
    const progressA = a.progress_percent ?? a.progress ?? 0;
    const progressB = b.progress_percent ?? b.progress ?? 0;
    return progressB - progressA;
  })[0];
  
  const nextAction = bestCourse ? {
    label: 'Suggested next step',
    text: `Your ${bestCourse.course_name || bestCourse.name || 'course'} is ${bestCourse.progress_percent ?? bestCourse.progress ?? 0}% done — keep going to finish it!`,
    courseId: bestCourse.course_id || bestCourse.id
  } : {
    label: 'Suggested next step',
    text: "You're all clear on your active courses! Let me know if you want to set a new goal.",
    courseId: ''
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  React.useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const getNavClass = (path: string) => {
    const isActive = location.pathname === path;
    const baseClass = "flex flex-col items-center gap-1 transition-colors";
    return isActive 
      ? `${baseClass} text-accent-sage hover:text-accent-sage/80`
      : `${baseClass} text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri`;
  };

  return (
    <div className="w-full bg-bg-primary dark:bg-bg-dark min-h-screen">
      {/* Header */}
      {!children && (
        <div className="flex flex-col sticky top-0 z-10">
          <AnnouncementBanner />
          <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-bg-primary/95 dark:bg-bg-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
            <h1 className="font-serif text-[24px] text-text-primary dark:text-text-darkPri">
              {getGreeting()}, {(user?.full_name || 'Learner').split(' ')[0]}
            </h1>
            <button onClick={() => navigate('/settings')} className="text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {children ? (
        <div className="pb-[100px] flex flex-col items-center">
          {children}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="px-6 pb-[100px] pt-1 flex flex-col gap-4 max-w-[430px] mx-auto"
        >
        <motion.div variants={cardVariants}>
          <LearningRhythm />
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <CoachCard message="I'm keeping track of your learning rhythm and goals. Let me know if you want to chat about your progress!" triggeredBy="momentum" />
        </motion.div>
        <motion.div variants={cardVariants}>
          <NextActionCard label={nextAction.label} text={nextAction.text} courseId={nextAction.courseId} />
        </motion.div>
        
        <motion.div variants={cardVariants} className="mt-2">
          <h2 className="text-[14px] font-serif text-text-primary dark:text-text-darkPri mb-3">Your courses</h2>
          <StackedProgressBar />
          <CourseCardsTabs />
        </motion.div>

        <motion.div variants={cardVariants} className="mt-2">
          <UpcomingDue />
        </motion.div>

        <motion.div variants={cardVariants}>
          <h2 className="text-[14px] font-serif text-text-primary dark:text-text-darkPri mb-3">Goals this week</h2>
          <GoalsList />
        </motion.div>
      </motion.div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary dark:bg-bg-darkCard border-t border-border-light dark:border-border-dark flex justify-around items-center pt-3 pb-[env(safe-area-inset-bottom,20px)] px-2 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate('/')} className={getNavClass('/')}>
          <Home size={20} />
          <span className="text-[10px] font-sans font-medium">Home</span>
        </button>
        <button onClick={() => navigate('/coach')} className={getNavClass('/coach')}>
          <MessageSquare size={20} />
          <span className="text-[10px] font-sans font-medium">Coach</span>
        </button>
        <button onClick={() => navigate('/goals')} className={getNavClass('/goals')}>
          <Target size={20} />
          <span className="text-[10px] font-sans font-medium">Goals</span>
        </button>
        <button onClick={() => navigate('/reminders')} className={getNavClass('/reminders')}>
          <div className="relative">
            <Bell size={20} strokeWidth={location.pathname === '/reminders' ? 2.5 : 2} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-sans font-medium">Reminders</span>
        </button>
      </div>
    </div>
  );
};
