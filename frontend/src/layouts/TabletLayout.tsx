import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Target, Settings, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

import { CoachCard } from '../components/dashboard/CoachCard';
import { NextActionCard } from '../components/dashboard/NextActionCard';
import { GoalsList } from '../components/dashboard/GoalsList';
import { UpcomingDue } from '../components/dashboard/UpcomingDue';
import { StackedProgressBar } from '../components/dashboard/StackedProgressBar';
import { CourseCardsTabs } from '../components/dashboard/CourseCardsTabs';
import { useDashboardStore } from '../store/dashboardStore';
import { useRemindersStore } from '../store/useRemindersStore';
import { SettingsMasterPanel } from '../components/settings/SettingsMasterPanel';
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

interface TabletLayoutProps {
  children?: React.ReactNode;
}

export const TabletLayout = ({ children }: TabletLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { isSettingsOpen, setSettingsOpen, sidebarVisible } = useDashboardStore();
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
    const baseClass = "p-3 w-12 h-12 flex items-center justify-center rounded-xl transition-colors";
    return isActive 
      ? `${baseClass} bg-accent-sage/8 text-accent-sage`
      : `${baseClass} text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri`;
  };

  return (
    <div className="w-full bg-bg-primary dark:bg-bg-dark min-h-screen flex relative">
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-bg-primary dark:bg-bg-dark z-50 shadow-2xl border-l border-border-light dark:border-border-dark flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 py-6 border-b border-border-light dark:border-border-dark shrink-0">
                <h2 className="font-serif text-[24px] text-text-primary dark:text-text-darkPri">Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">Close</button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <SettingsMasterPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Side Nav */}
      <div className={`shrink-0 bg-bg-secondary dark:bg-bg-darkCard border-r border-border-light dark:border-border-dark flex flex-col items-center sticky top-0 h-screen z-20 shadow-[4px_0_20px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out overflow-hidden ${sidebarVisible ? 'w-[64px]' : 'w-0 border-r-0'}`}>
        <div className="w-[64px] flex flex-col items-center py-6 gap-6 h-full">
        <button onClick={() => navigate('/')} className={getNavClass('/')}>
          <Home size={20} />
        </button>
        <button onClick={() => navigate('/coach')} className={getNavClass('/coach')}>
          <MessageSquare size={20} />
        </button>
        <button onClick={() => navigate('/goals')} className={getNavClass('/goals')}>
          <Target size={20} />
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
        </button>
        {(user?.role && ['support_staff', 'super_admin'].includes(user.role) || (user?.email && (user.email.toLowerCase() === 'vishal.reddy@iimbx.iimb.ac.in' || user.email.toLowerCase().includes('admin') || user.email.toLowerCase().includes('support')))) && (
          <button onClick={() => navigate('/admin')} className={getNavClass('/admin')}>
            <Shield size={20} />
          </button>
        )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {!children && (
          <div className="px-8 pt-10 pb-6 flex justify-between items-center bg-bg-primary/95 dark:bg-bg-dark/95 backdrop-blur-sm sticky top-0 z-10 w-full shrink-0">
            <h1 className="font-serif text-[28px] text-text-primary dark:text-text-darkPri">
              {getGreeting()}, {(user?.full_name || 'Learner').split(' ')[0]}
            </h1>
            <button 
              onClick={() => setSettingsOpen(true)}
              className="text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors"
            >
              <Settings size={22} />
            </button>
          </div>
        )}

        {/* Two Column Grid */}
        {children ? (
          <div className="flex-1 w-full pb-12 overflow-y-auto hidden-scrollbar px-8">
            {children}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="flex-1 px-6 pt-3 flex flex-col gap-5 w-full max-w-[800px] mx-auto"
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
            
            <motion.div variants={cardVariants} className="mt-4">
              <h2 className="text-[16px] font-serif text-text-primary dark:text-text-darkPri mb-3">Your courses</h2>
              <StackedProgressBar />
              <CourseCardsTabs />
            </motion.div>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              <motion.div variants={cardVariants}>
                <h2 className="text-[16px] font-serif text-text-primary dark:text-text-darkPri mb-3">Goals this week</h2>
                <GoalsList />
              </motion.div>
              <motion.div variants={cardVariants}>
                <UpcomingDue />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
