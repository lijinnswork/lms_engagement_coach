import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Plus, 
  MoreHorizontal, 
  X,
  Mail,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../../stores/authStore';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'support_staff';
  addedAt: string;
}

const PERMISSIONS = {
  super_admin: {
    title: 'Admin',
    description: 'Unrestricted access to all system settings, agents, and user data.',
    color: 'text-[#C9544D]',
    bg: 'bg-[#C9544D]/10',
    border: 'border-[#C9544D]/30',
    capabilities: [
      'Access all dashboards and user data',
      'Manage agent controls and system prompts',
      'View raw agent decision logs',
      'Invite and manage other administrators',
      'Modify global system settings'
    ]
  },
  support_staff: {
    title: 'Support Staff',
    description: 'Provide direct support to users, view basic metrics, and troubleshoot accounts.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    capabilities: [
      'Access basic dashboard numbers',
      'Lookup specific user accounts',
      'Reset user passwords and manage lockouts',
      'Cannot view agent coach monitors',
      'Cannot view system settings'
    ]
  }
};

export const RoleManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal State
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'support_staff'>('super_admin');

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        // Filter users that are support_staff or super_admin
        const filtered = data
          .filter((u: any) => u.role === 'super_admin' || u.role === 'support_staff')
          .map((u: any) => ({
            id: u.id,
            name: u.full_name || u.email.split('@')[0],
            email: u.email,
            role: u.role as 'super_admin' | 'support_staff',
            addedAt: u.created_at ? new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'
          }));
        setAdmins(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    
    try {
      const name = newEmail.split('@')[0];
      const res = await fetchWithAuth('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.charAt(0).toUpperCase() + name.slice(1),
          email: newEmail,
          role: selectedRole,
          lms_username: name
        })
      });
      
      if (res.ok) {
        setNewEmail('');
        setIsModalOpen(false);
        await loadAdmins();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to invite administrator');
      }
    } catch(err) {
      console.error(err);
      alert('Error creating administrator');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete administrator "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetchWithAuth(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadAdmins();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to delete administrator');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting administrator');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white font-serif flex items-center gap-2">
            <Shield className="text-[#C9544D]" />
            Roles
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage team access and specific admin capabilities.</p>
        </div>
        <div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-[#7B9EA8] text-[#0D1117] hover:bg-[#A3BFC7] font-medium rounded-md transition-colors"
           >
             <Plus size={18} /> Invite Admin
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl overflow-hidden flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#3A3F4D] flex items-center gap-4 bg-[#1C2128]/50">
           <div className="relative flex-1 max-w-md">
             <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="Search administrators..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-[#0D1117] border border-[#3A3F4D] rounded-md pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-[#7B9EA8]" 
             />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
           <table className="w-full text-left text-sm">
             <thead className="bg-[#1C2128]/80 text-gray-400 border-b border-[#3A3F4D]">
               <tr>
                 <th className="py-3 px-5 font-medium">User</th>
                 <th className="py-3 px-5 font-medium">Role & Permissions</th>
                 <th className="py-3 px-5 font-medium">Added</th>
                 <th className="py-3 px-5 font-medium text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="text-gray-300">
               {loading ? (
                 <tr>
                   <td colSpan={4} className="py-12 text-center text-gray-500 font-sans">
                     <div className="flex justify-center items-center gap-2">
                       <Loader2 className="animate-spin text-[#7B9EA8]" size={18} />
                       Loading administrators...
                     </div>
                   </td>
                 </tr>
               ) : (
                 filteredAdmins.map(admin => {
                   const roleData = PERMISSIONS[admin.role] || PERMISSIONS.support_staff;
                   return (
                     <tr key={admin.id} className="border-b border-[#3A3F4D]/50 hover:bg-[#1C2128] transition-colors">
                       <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center font-bold text-white uppercase border border-[#3A3F4D]">
                               {admin.name.charAt(0)}
                             </div>
                             <div>
                               <p className="font-medium text-white">{admin.name}</p>
                               <p className="text-xs text-gray-500">{admin.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-4 px-5">
                          <div className="flex flex-col items-start gap-1">
                             <span className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide border ${roleData.bg} ${roleData.color} ${roleData.border}`}>
                               {roleData.title}
                             </span>
                             <span className="text-[11px] text-gray-500">{roleData.description}</span>
                          </div>
                       </td>
                       <td className="py-4 px-5 text-gray-400">{admin.addedAt}</td>
                       <td className="py-4 px-5 text-right">
                         <button 
                           onClick={() => handleDelete(admin.id, admin.name)} 
                           className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                         >
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   );
                 })
               )}
               {!loading && filteredAdmins.length === 0 && (
                 <tr>
                   <td colSpan={4} className="py-12 text-center text-gray-500 font-sans">
                     No administrators found matching your search.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
               onClick={() => setIsModalOpen(false)} 
             />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="bg-[#0D1117] border border-[#1C2128] rounded-xl w-full max-w-2xl relative z-50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                <div className="p-5 border-b border-[#1C2128] flex justify-between items-center bg-[#1C2128]/30">
                  <h2 className="text-xl font-semibold text-white">Invite Administrator</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto hidden-scrollbar flex-1">
                  <form id="invite-form" onSubmit={handleInvite} className="space-y-8">
                     
                     {/* Email Input */}
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                       <div className="relative">
                         <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                         <input 
                           type="email" 
                           required
                           value={newEmail}
                           onChange={e => setNewEmail(e.target.value)}
                           placeholder="colleague@institute.edu"
                           className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-lg pl-10 pr-4 py-2.5 text-white outline-none focus:border-[#7B9EA8]"
                         />
                       </div>
                     </div>

                     {/* Role Selection */}
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-3">Assign Role & Permissions</label>
                       <div className="space-y-3">
                          {(Object.keys(PERMISSIONS) as Array<keyof typeof PERMISSIONS>).map(roleKey => {
                            const role = PERMISSIONS[roleKey];
                            const isSelected = selectedRole === roleKey;
                            return (
                              <div 
                                key={roleKey}
                                onClick={() => setSelectedRole(roleKey)}
                                className={`cursor-pointer border rounded-xl p-4 transition-all duration-200 ${
                                  isSelected 
                                    ? `bg-[#1C2128] border-[#7B9EA8] shadow-[0_0_0_1px_#7B9EA8]` 
                                    : 'bg-[#0D1117] border-[#3A3F4D] hover:border-gray-500'
                                }`}
                              >
                                 <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected ? 'border-[#7B9EA8]' : 'border-gray-500'
                                    }`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#7B9EA8]" />}
                                    </div>
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                         <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{role.title}</h4>
                                         <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${role.bg} ${role.color}`}>Privilege Level</span>
                                       </div>
                                       <p className="text-sm text-gray-400 mb-3">{role.description}</p>
                                       
                                       <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 ${isSelected ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
                                         {role.capabilities.map((cap, idx) => (
                                           <div key={idx} className="flex items-start gap-2">
                                              <CheckCircle2 size={14} className={cap.startsWith('Cannot') ? 'text-gray-600 mt-0.5 shrink-0' : 'text-green-500/70 mt-0.5 shrink-0'} />
                                              <span className={`text-xs ${cap.startsWith('Cannot') ? 'text-gray-500' : 'text-gray-300'}`}>
                                                {cap}
                                              </span>
                                           </div>
                                         ))}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                     </div>
                  </form>
                </div>

                <div className="p-5 border-t border-[#1C2128] bg-[#1C2128]/30 flex justify-end gap-3 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white bg-[#1C2128] border border-[#3A3F4D] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    form="invite-form"
                    className="px-6 py-2 bg-[#7B9EA8] text-[#0D1117] font-medium rounded-lg hover:bg-[#A3BFC7] transition-colors shadow-lg shadow-[#7B9EA8]/20"
                  >
                    Send Invitation
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
