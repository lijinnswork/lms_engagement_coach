import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../components/Admin/AdminSidebar';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Lock, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDashboardStore } from '../store/dashboardStore';
import { useAuthStore } from '../stores/authStore';
import { AccountMasterPanel } from '../components/account/AccountMasterPanel';

export const AdminLayout: React.FC = () => {
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const { isAccountOpen, setAccountOpen } = useDashboardStore();
  const { user } = useAuthStore();

  let role = user?.role || 'student';
  const isAdminByEmail = user?.email && (
    user.email.toLowerCase() === 'vishal.reddy@iimbx.iimb.ac.in' || 
    user.email.toLowerCase() === 'iimbx.tools@iimbx.iimb.ac.in' || 
    user.email.toLowerCase().includes('admin') || 
    user.email.toLowerCase().includes('support')
  );
  if (role === 'student' && isAdminByEmail) {
    role = 'super_admin';
  }
  const roleDisplayMap: Record<string, string> = {
    support_staff: 'Support',
    super_admin: 'Admin'
  };

  return (
    <div className="flex h-screen w-full bg-[#0B0E14] overflow-hidden text-gray-200 font-sans relative">
      <AnimatePresence>
        {isAccountOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="dark fixed top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-[#0D1117] z-50 shadow-2xl border-l border-[#1C2128] flex flex-col overflow-hidden text-gray-200"
              style={{ '--bg-dark': '#0D1117', '--bg-darkCard': '#1C2128', '--border-dark': '#1C2128' } as React.CSSProperties}
            >
              <div className="flex justify-between items-center px-6 py-6 border-b border-[#1C2128] shrink-0">
                <h2 className="font-serif text-[24px] text-white">My Account</h2>
                <button onClick={() => setAccountOpen(false)} className="text-[14px] font-medium text-gray-400 hover:text-white transition-colors">Close</button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <AccountMasterPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - automatically responsive via component implementation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Header with distinctive red border */}
        <header className="h-[60px] border-b border-[#1C2128] border-t-2 border-t-[#C9544D] bg-[#0D1117] flex items-center justify-between px-6 shrink-0 shadow-sm z-10 hidden md:flex">
           <div className="flex items-center gap-2">
             <Lock size={16} className="text-[#C9544D]" />
             <h1 className="font-semibold text-gray-200">Admin · Learner Engagement App</h1>
           </div>
           
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setAccountOpen(true)}
               className="flex items-center gap-3 p-1.5 px-2 bg-[#1C2128] rounded-xl hover:bg-[#252b36] transition-colors border border-transparent hover:border-[#C9544D]"
             >
               <div className="w-8 h-8 rounded-full bg-accent-sage flex items-center justify-center font-bold text-white uppercase">
                 {user?.full_name?.charAt(0) || 'A'}
               </div>
               <div className="flex flex-col overflow-hidden text-left pr-2">
                 <span className="text-sm font-medium truncate leading-tight text-white">{user?.full_name}</span>
                 <span className="text-[11px] text-[#C9544D] font-mono tracking-wider">{roleDisplayMap[role]}</span>
               </div>
             </button>
           </div>
        </header>

        {/* Mobile Header equivalent */}
        {breakpoint !== 'desktop' && (
           <header className="h-[60px] border-b border-[#1C2128] border-t-2 border-t-[#C9544D] bg-[#0D1117] flex items-center justify-center px-4 shrink-0 shadow-sm z-10 w-full pl-16">
              <h1 className="font-semibold text-gray-200 text-sm truncate">Admin Mode</h1>
           </header>
        )}

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-bg-darkCard/30 backdrop-blur-3xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
