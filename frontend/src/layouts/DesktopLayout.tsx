import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Target, Settings, Lock, PanelLeftClose, PanelLeftOpen, Bell, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { mockUser, mockCoachMessage, mockNextAction } from '../data/mockDashboard';
import { CoachCard } from '../components/dashboard/CoachCard';
import { NextActionCard } from '../components/dashboard/NextActionCard';
import { GoalsList } from '../components/dashboard/GoalsList';
import { EngagementRadarWidget } from '../components/dashboard/EngagementRadarWidget';
import { useDashboardStore } from '../store/dashboardStore';
import { useCoachStore } from '../store/coachStore';
import { AnnouncementBanner } from '../components/dashboard/AnnouncementBanner';
import { UpcomingDue } from '../components/dashboard/UpcomingDue';
import { StackedProgressBar } from '../components/dashboard/StackedProgressBar';
import { CourseCardsTabs } from '../components/dashboard/CourseCardsTabs';
import { useRemindersStore } from '../store/useRemindersStore';
import { SettingsMasterPanel } from '../components/settings/SettingsMasterPanel';
import { AccountMasterPanel } from '../components/account/AccountMasterPanel';
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

interface DesktopLayoutProps {
  children?: React.ReactNode;
}

export const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSettingsOpen, setSettingsOpen, isAccountOpen, setAccountOpen, sidebarVisible, setSidebarVisible } = useDashboardStore();
  const { pendingCount, fetchReminders } = useRemindersStore();
  const { user } = useAuthStore();
  const { conversations, createNewConversation, switchConversation, conversationId, fetchConversations } = useCoachStore();
  const [coachDropdownOpen, setCoachDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    fetchReminders();
    if (location.pathname === '/coach') {
      fetchConversations();
      setCoachDropdownOpen(true);
    }
  }, [fetchReminders, location.pathname, fetchConversations]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getNavClass = (path: string) => {
    const isActive = location.pathname === path || (path === '/' && location.pathname.startsWith('/course/'));
    const baseClass = "flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all w-full";
    return isActive 
      ? `${baseClass} bg-gradient-to-r from-[#e1e9f8] to-[#f0f4fa] dark:from-[#1a2b4c] dark:to-[#131f38] text-[var(--accent-primary)] dark:text-[#a5bdf0] font-semibold border-l-4 border-[var(--accent-primary)]`
      : `${baseClass} text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri hover:bg-black/5 dark:hover:bg-white/5 font-medium border-l-4 border-transparent`;
  };
  
  return (
    <div className="w-full bg-bg-primary dark:bg-bg-dark min-h-screen flex flex-col relative">
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

      <AnimatePresence>
        {isAccountOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountOpen(false)}
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
                <h2 className="font-serif text-[24px] text-text-primary dark:text-text-darkPri">My Account</h2>
                <button onClick={() => setAccountOpen(false)} className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">Close</button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <AccountMasterPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Expand Sidebar Tab */}
      {!sidebarVisible && (
        <button 
          onClick={() => setSidebarVisible(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-bg-secondary dark:bg-bg-darkCard border-y border-r border-border-light dark:border-border-dark py-6 px-2.5 rounded-r-xl text-text-secondary hover:text-text-primary transition-colors shadow-md hover:shadow-lg flex items-center justify-center group"
          title="Expand menu"
        >
          <PanelLeftOpen size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Global Announcement Banner */}
      {!children && <AnnouncementBanner />}

      {/* Global Top Bar */}
      <header className="sticky top-0 z-30 w-full bg-bg-primary/95 dark:bg-bg-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark flex items-center h-[84px]">
        <div className="w-full max-w-[1600px] mx-auto flex items-center h-full">
          <div className="w-[160px] h-full flex items-center justify-center shrink-0 relative px-2">
            <button onClick={() => navigate('/')} className="focus:outline-none transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="IIMB Logo" className="h-[96px] object-contain scale-[1.5] origin-center" />
            </button>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[36px] w-px bg-border-light dark:bg-border-dark"></div>
          </div>
          
          <div className="flex-1 flex items-center justify-between px-6">
            <h1 className="font-serif text-[32px] font-bold text-text-primary dark:text-text-darkPri leading-none">
              {getGreeting()}, {(user?.full_name || mockUser.name).split(' ')[0]}
            </h1>
            <div className="flex items-center gap-3 pr-4">
              <button 
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className={`text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors p-2 rounded-full ${isSettingsOpen ? 'bg-black/5 dark:bg-white/5' : ''}`}
              >
                <Settings size={22} />
              </button>
              <button 
                onClick={() => setAccountOpen(true)}
                title="Account"
                className={`w-8 h-8 rounded-full border-2 transition-colors flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent-sage to-accent-peach text-white font-medium text-[14px] ${isAccountOpen ? 'border-accent-sage' : 'border-border-light dark:border-border-dark hover:border-accent-sage'}`}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full flex-1 flex max-w-[1600px] mx-auto relative">
        
        {/* Sidebar */}
        <div className={`relative shrink-0 bg-bg-secondary dark:bg-bg-darkCard border-r border-border-light dark:border-border-dark flex flex-col sticky top-[84px] h-[calc(100vh-84px)] z-20 transition-all duration-300 ease-out overflow-hidden ${sidebarVisible ? 'w-[160px]' : 'w-0 border-r-0'}`}>
          <div className="w-[160px] px-3 pt-6 pb-6 flex flex-col h-full overflow-y-auto hidden-scrollbar relative">
            
            <button 
              onClick={() => setSidebarVisible(false)} 
              className="absolute top-2 right-2 p-1 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5"
              title="Collapse menu"
            >
              <PanelLeftClose size={14} />
            </button>

            <div className="flex flex-col gap-2 flex-1 mt-2">
              <button onClick={() => navigate('/')} className={getNavClass('/')}>
                <Home size={18} />
                <span className="text-[13px] font-sans font-medium">Home</span>
              </button>
              
              <div className="flex flex-col w-full">
                <button 
                  onClick={() => { 
                    if (location.pathname !== '/coach') navigate('/coach'); 
                    else setCoachDropdownOpen(!coachDropdownOpen); 
                  }} 
                  className={getNavClass('/coach')}
                >
                  <MessageSquare size={18} />
                  <span className="text-[13px] font-sans font-medium flex-1 text-left">Coach</span>
                </button>
                {coachDropdownOpen && location.pathname === '/coach' && (
                  <div className="flex flex-col pl-9 pr-2 py-2 gap-2 w-full animate-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => createNewConversation()} 
                      className="text-[12px] font-semibold text-accent-sage hover:text-accent-sage/80 text-left flex items-center gap-1 w-fit"
                    >
                      + New Chat
                    </button>
                    <div className="flex flex-col gap-1 mt-1">
                      {conversations.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => switchConversation(c.id)} 
                          className={`text-[12px] truncate w-full text-left py-1 transition-colors ${conversationId === c.id ? 'text-text-primary dark:text-text-darkPri font-medium' : 'text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri'}`}
                          title={c.summary || 'Chat session'}
                        >
                          {new Date(c.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/goals')} className={getNavClass('/goals')}>
                <Target size={18} />
                <span className="text-[13px] font-sans font-medium">Goals</span>
              </button>
              <button onClick={() => navigate('/reminders')} className={getNavClass('/reminders')}>
                <div className="relative">
                  <Bell size={18} />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-sans font-medium">Reminders</span>
              </button>
              
              <div className="h-px w-full bg-border-light dark:bg-border-dark my-4"></div>
              
              {(user?.role && ['support_staff', 'super_admin'].includes(user.role) || (user?.email && (user.email.toLowerCase() === 'vishal.reddy@iimbx.iimb.ac.in' || user.email.toLowerCase().includes('admin') || user.email.toLowerCase().includes('support')))) && (
                <button 
                  onClick={() => navigate('/admin')} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] w-full text-[#C9544D] hover:bg-[#C9544D]/10 hover:text-[#C9544D] transition-colors border border-transparent hover:border-[#C9544D]/20"
                >
                  <Lock size={18} />
                  <span className="text-[13px] font-sans font-medium">Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className={`w-full flex flex-col min-w-0 border-r border-border-light dark:border-border-dark/50 lg:border-none flex-1 ${location.pathname === '/coach' ? 'h-[calc(100vh-84px)]' : ''}`}>
          <div className={`flex-1 w-full flex justify-center ${location.pathname === '/coach' ? 'overflow-hidden' : 'pt-6 pb-12 overflow-y-auto'} hidden-scrollbar`}>
            {children ? (
              children
            ) : (
              <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible"
                className="flex-1 px-6 pt-0 flex flex-col gap-5 w-full max-w-[1000px]"
              >
                <motion.div variants={cardVariants}>
                  <LearningRhythm />
                </motion.div>
                
                <motion.div variants={cardVariants}>
                  <CoachCard message={mockCoachMessage.text} triggeredBy={mockCoachMessage.triggeredBy} />
                </motion.div>
                <motion.div variants={cardVariants}>
                  <NextActionCard label={mockNextAction.label} text={mockNextAction.text} courseId={mockNextAction.courseId} />
                </motion.div>
                
                <motion.div variants={cardVariants} className="mt-4">
                  <h2 className="text-[16px] font-serif text-text-primary dark:text-text-darkPri mb-3">Your courses</h2>
                  <StackedProgressBar />
                  <CourseCardsTabs />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - Persistent across all pages */}
        <div className="flex-1 min-w-[300px] max-w-[320px] bg-bg-primary dark:bg-bg-dark px-4 pt-8 pb-12 sticky top-[84px] h-[calc(100vh-84px)] overflow-hidden flex flex-col border-l border-border-light dark:border-border-dark">
          <div className="flex-1 overflow-y-auto relative hidden-scrollbar pb-12">
            <motion.div 
              variants={containerVariants} 
              initial="hidden" 
              animate="visible"
              className="flex flex-col gap-6 w-full max-w-[300px]"
            >
              <motion.div variants={cardVariants}>
                {!children ? (
                  <>
                    <h2 className="text-[16px] font-serif text-text-primary dark:text-text-darkPri mb-3">Goals this week</h2>
                    <GoalsList />
                  </>
                ) : (
                  <EngagementRadarWidget />
                )}
              </motion.div>

              <motion.div variants={cardVariants} className="mt-2">
                <UpcomingDue />
              </motion.div>
            </motion.div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
