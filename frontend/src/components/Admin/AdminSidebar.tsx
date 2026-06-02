import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  BarChart3, 
  Users, 
  Bot, 
  Settings2, 
  ListOrdered, 
  Wrench,
  LogOut,
  Menu,
  X,
  Lock,
  Shield,
  Sliders,
  Megaphone
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);

  let role = user?.role || 'student';
  
  // Temporary mock logic matching ProtectedAdminRoute
  const isAdminByEmail = user?.email && (
    user.email.toLowerCase() === 'vishal.reddy@iimbx.iimb.ac.in' || 
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

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <BarChart3 size={20} />, roles: ['support_staff', 'super_admin'] },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} />, roles: ['support_staff', 'super_admin'] },
    { name: 'Live Stats', path: '/admin/live-stats', icon: <BarChart3 size={20} />, roles: ['super_admin'] },
    { name: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={20} />, roles: ['super_admin'] },
    { name: 'Roles', path: '/admin/roles', icon: <Shield size={20} />, roles: ['super_admin'] },
    { name: 'Coach Monitor', path: '/admin/coach', icon: <Bot size={20} />, roles: ['super_admin'] },
    { name: 'Agent Controls', path: '/admin/agents', icon: <Settings2 size={20} />, roles: ['super_admin'] },
    { name: 'Coach Studio', path: '/admin/coach-studio', icon: <Sliders size={20} />, roles: ['super_admin'] },
    { name: 'Agent Logs', path: '/admin/logs', icon: <ListOrdered size={20} />, roles: ['super_admin'] },
    { name: 'System', path: '/admin/system', icon: <Wrench size={20} />, roles: ['super_admin'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#0D1117] text-white w-64 border-r border-[#1C2128]">
      <div className="p-6 flex items-center gap-3 border-b border-[#1C2128]">
         <div className="bg-[#C9544D] p-1.5 rounded flex items-center justify-center">
            <Lock size={16} className="text-white" />
         </div>
         <span className="font-semibold text-lg uppercase tracking-wide">Admin</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-sans text-sm
              ${isActive 
                ? 'bg-[#C9544D]/10 text-white border border-[#C9544D]/20' 
                : 'text-gray-400 hover:text-white hover:bg-[#1C2128]'
              }
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1C2128]">


        <button 
          onClick={() => navigate('/')} 
          className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
           ← Student View
        </button>

        <button 
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white flex items-center gap-2 mt-1 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  if (breakpoint === 'desktop') {
    return SidebarContent;
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-4 z-50 p-2 bg-[#0D1117] text-white rounded-md shadow-md"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
           <div className="relative z-50 h-full transform transition-transform duration-300">
             <button 
               onClick={() => setIsOpen(false)}
               className="absolute top-4 -right-12 p-2 bg-[#0D1117] text-white rounded-md shadow-md"
             >
               <X size={20} />
             </button>
             {SidebarContent}
           </div>
        </div>
      )}
    </>
  );
};
