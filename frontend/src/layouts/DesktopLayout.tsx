import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Target, Settings, Lock, PanelLeftClose, PanelLeftOpen, Bell, User as UserIcon } from 'lucide-react';
import { useAuthStore, fetchWithAuth } from '../stores/authStore';

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
import { WavingHand } from '../components/Common/WavingHand';
import { useNudgeStore } from '../store/nudgeStore';
import { NotificationsPanel } from '../components/Notifications/NotificationsPanel';

interface ConversationSidebarItemProps {
  conversation: any;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void> | void;
}

const ConversationSidebarItem = ({ conversation, isActive, onSelect, onRename }: ConversationSidebarItemProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [title, setTitle] = React.useState(conversation.summary || '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayTitle = conversation.summary && conversation.summary !== "New Chat"
    ? conversation.summary
    : `Conversation — ${new Date(conversation.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (title.trim() && title.trim() !== conversation.summary) {
      setSaving(true);
      try {
        await onRename(conversation.id, title.trim());
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(conversation.summary || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full text-[12px] bg-bg-primary dark:bg-bg-dark border border-accent-sage rounded px-1.5 py-0.5 text-text-primary dark:text-text-darkPri focus:outline-none focus:ring-1 focus:ring-accent-sage"
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5 w-full justify-between group">
      <button 
        onClick={() => onSelect(conversation.id)} 
        onDoubleClick={() => setIsEditing(true)}
        className={`text-[12px] truncate flex-1 text-left py-1 transition-colors ${isActive ? 'text-text-primary dark:text-text-darkPri font-medium' : 'text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri'}`}
        title={displayTitle}
        disabled={saving}
      >
        {displayTitle}
      </button>
      {saving && (
        <span className="text-[10px] italic text-accent-sage shrink-0 animate-pulse">
          Saving...
        </span>
      )}
    </div>
  );
};

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
  const { isSettingsOpen, setSettingsOpen, isAccountOpen, setAccountOpen, sidebarVisible, setSidebarVisible, coachGreeting, fetchCoachGreeting } = useDashboardStore();
  const { pendingCount, fetchReminders } = useRemindersStore();
  const { user } = useAuthStore();
  const [impersonateQuery, setImpersonateQuery] = React.useState('');
  const [impersonateTarget, setImpersonateTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    setImpersonateTarget(localStorage.getItem('impersonateUser'));
  }, []);

  const { conversations, createNewConversation, switchConversation, conversationId, fetchConversations, renameConversation } = useCoachStore();
  const { nudges, isPanelOpen, setPanelOpen, fetchNudges } = useNudgeStore();
  const [coachDropdownOpen, setCoachDropdownOpen] = React.useState(false);
  const [enrolledCourses, setEnrolledCourses] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchWithAuth('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEnrolledCourses(data);
        }
      })
      .catch(e => console.error(e));
  }, []);

  const inProgress = enrolledCourses.filter((c: any) => {
    const progressObj = typeof c.progress === 'object' && c.progress !== null ? c.progress : {};
    const progressPercent = progressObj.progress_percent ?? c.progress_percent ?? 0;
    return progressPercent < 100;
  });
  
  const bestCourse = inProgress.sort((a: any, b: any) => {
    const progressObjA = typeof a.progress === 'object' && a.progress !== null ? a.progress : {};
    const progressPercentA = progressObjA.progress_percent ?? a.progress_percent ?? 0;
    const progressObjB = typeof b.progress === 'object' && b.progress !== null ? b.progress : {};
    const progressPercentB = progressObjB.progress_percent ?? b.progress_percent ?? 0;
    return progressPercentB - progressPercentA;
  })[0];
  
  const bestCourseProgressObj = bestCourse && typeof bestCourse.progress === 'object' && bestCourse.progress !== null ? bestCourse.progress : {};
  const bestCourseProgressPercent = bestCourse ? (bestCourseProgressObj.progress_percent ?? bestCourse.progress_percent ?? 0) : 0;
  
  const nextAction = bestCourse ? {
    label: 'Suggested next step',
    text: `Your ${bestCourse.course_name || bestCourse.name || 'course'} is ${bestCourseProgressPercent}% done — keep going to finish it!`,
    courseId: bestCourse.course_id || bestCourse.id
  } : {
    label: 'Suggested next step',
    text: "You're all clear on your active courses! Let me know if you want to set a new goal.",
    courseId: ''
  };

  React.useEffect(() => {
    fetchReminders();
    fetchNudges();
    fetchCoachGreeting();
    if (location.pathname === '/coach') {
      fetchConversations();
      setCoachDropdownOpen(true);
    }
  }, [fetchReminders, fetchNudges, location.pathname, fetchConversations, fetchCoachGreeting]);

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
      {impersonateTarget && (
        <div className="w-full bg-accent-sage/20 border-b border-accent-sage/30 py-3 px-6 flex justify-between items-center text-sm text-text-primary dark:text-text-darkPri font-medium select-none z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sage opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-sage"></span>
            </span>
            <span>Admin Impersonation Mode: Viewing dashboard as student <strong>{impersonateTarget}</strong></span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('impersonateUser');
              window.location.reload();
            }}
            className="bg-accent-sage text-white text-xs px-3.5 py-1.5 rounded-lg hover:bg-accent-sage/90 transition-colors font-semibold"
          >
            Exit Student View
          </button>
        </div>
      )}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[150]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-bg-primary dark:bg-bg-dark z-[200] shadow-2xl border-l border-border-light dark:border-border-dark flex flex-col overflow-hidden"
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
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[150]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-bg-primary dark:bg-bg-dark z-[200] shadow-2xl border-l border-border-light dark:border-border-dark flex flex-col overflow-hidden"
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
              {getGreeting()}, {(user?.full_name || 'Learner').split(' ')[0]}
            </h1>
            
            {/* Admin Impersonation Search Box */}
            {((user?.role && ['support_staff', 'super_admin'].includes(user.role)) || !!impersonateTarget) && (
              <div className="flex items-center gap-2 border border-border-light dark:border-border-dark rounded-xl px-3 py-1.5 bg-bg-secondary dark:bg-bg-darkCard focus-within:border-accent-sage/50 transition-colors ml-6 mr-auto">
                <input
                  type="text"
                  placeholder="View as Student (email/username)..."
                  value={impersonateQuery}
                  onChange={(e) => setImpersonateQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && impersonateQuery.trim()) {
                      localStorage.setItem('impersonateUser', impersonateQuery.trim());
                      window.location.href = '/';
                    }
                  }}
                  className="bg-transparent text-[13px] text-text-primary dark:text-text-darkPri focus:outline-none w-[220px]"
                />
                <button
                  onClick={() => {
                    if (impersonateQuery.trim()) {
                      localStorage.setItem('impersonateUser', impersonateQuery.trim());
                      window.location.href = '/';
                    }
                  }}
                  className="text-[12px] text-accent-sage font-semibold hover:text-accent-sage/80"
                >
                  Go
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 pr-4">
              <WavingHand hasNudges={nudges.length > 0} onClick={() => setPanelOpen(true)} />
              <button 
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className={`text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri transition-colors p-2 rounded-full cursor-pointer ${isSettingsOpen ? 'bg-black/5 dark:bg-white/5' : ''}`}
              >
                <Settings size={22} />
              </button>
              <button 
                onClick={() => setAccountOpen(true)}
                title="Account"
                className={`w-8 h-8 rounded-full border-2 transition-colors flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent-sage to-accent-peach text-white font-medium text-[14px] cursor-pointer ${isAccountOpen ? 'border-accent-sage' : 'border-border-light dark:border-border-dark hover:border-accent-sage'}`}
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
                        <ConversationSidebarItem
                          key={c.id}
                          conversation={c}
                          isActive={conversationId === c.id}
                          onSelect={switchConversation}
                          onRename={renameConversation}
                        />
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
              
              {(user?.role && ['support_staff', 'super_admin'].includes(user.role) || (user?.email && (user.email.toLowerCase() === 'vishal.reddy@iimbx.iimb.ac.in' || user.email.toLowerCase() === 'iimbx.tools@iimbx.iimb.ac.in' || user.email.toLowerCase().includes('admin') || user.email.toLowerCase().includes('support')))) && (
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
                  <CoachCard message={coachGreeting} triggeredBy="momentum" />
                </motion.div>
                <motion.div variants={cardVariants}>
                  <NextActionCard label={nextAction.label} text={nextAction.text} courseId={nextAction.courseId} />
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
      <NotificationsPanel isOpen={isPanelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
};
