import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  MoreHorizontal, 
  X,
  ChevronDown,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

// Mock typings
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Disabled';
  lastLogin: string;
  avatar?: string;
  joinDate: string;
}

const MOCK_USERS: UserData[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya@company.com', role: 'student', status: 'Active', lastLogin: '2h ago', joinDate: 'March 2, 2026' },
  { id: '2', name: 'Amit Patel', email: 'amit@company.com', role: 'student', status: 'Active', lastLogin: '1d ago', joinDate: 'March 1, 2026' },
  { id: '3', name: 'Sarah Chen', email: 'sarah@company.com', role: 'support_staff', status: 'Active', lastLogin: '5h ago', joinDate: 'Feb 15, 2026' },
  { id: '4', name: 'Ravi Kumar', email: 'ravi@company.com', role: 'student', status: 'Disabled', lastLogin: '30d ago', joinDate: 'Jan 10, 2026' },
  { id: '5', name: 'Admin User', email: 'super@company.com', role: 'super_admin', status: 'Active', lastLogin: '1m ago', joinDate: 'Jan 1, 2026' },
  { id: '6', name: 'Lijin NS', email: 'lijin.ns@iimbx.iimb.ac.in', role: 'super_admin', status: 'Active', lastLogin: 'Just now', joinDate: 'Apr 27, 2026' }
];

export const UserManagement: React.FC = () => {
  const { user } = useAuthStore();
  const isAdminOrSuper = ['super_admin'].includes(user?.role || '');
  const isSuper = user?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filtering
  const filteredUsers = MOCK_USERS.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-[#C9544D] text-white border-[#C9544D]';
      
      case 'support_staff': return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      default: return 'bg-[#7B9EA8]/20 text-[#7B9EA8] border-[#7B9EA8]/40';
    }
  };

  const exportCSV = () => {
    console.log("Exporting CSV...");
    alert("CSV Export triggered.");
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-white font-serif">User Management</h1>
        <div className="flex items-center gap-3">
          {isAdminOrSuper && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B9EA8] text-[#0D1117] hover:bg-[#A3BFC7] font-medium rounded-md transition-colors"
            >
              <Plus size={18} /> Add User
            </button>
          )}
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-[#3A3F4D] text-gray-300 hover:text-white rounded-md transition-colors bg-[#242834]"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md pl-10 pr-4 py-2 outline-none focus:border-[#7B9EA8] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm text-gray-400">Status:</span>
           <select 
             value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
             className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 outline-none focus:border-[#7B9EA8]"
           >
             <option value="All">All</option>
             <option value="Active">Active</option>
             <option value="Disabled">Disabled</option>
           </select>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm text-gray-400">Role:</span>
           <select 
             value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
             className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 outline-none focus:border-[#7B9EA8]"
           >
             <option value="All">All</option>
             <option value="student">student</option>
             <option value="support_staff">support_staff</option>
             
             <option value="super_admin">super_admin</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3A3F4D] text-sm text-gray-400 bg-[#1C2128]/50">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Last Login</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-[#3A3F4D]/50 hover:bg-[#1C2128] transition-colors group">
                  <td className="py-3 px-4 text-white font-medium">{u.name}</td>
                  <td className="py-3 px-4 text-gray-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs border rounded-full ${getRoleBadgeColor(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                     <span className={`flex items-center gap-1.5 text-sm ${u.status === 'Active' ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                        {u.status}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">{u.lastLogin}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                       <button 
                         onClick={() => setSelectedUser(u)}
                         className="text-sm font-medium text-[#7B9EA8] hover:text-white px-2 py-1 rounded hover:bg-[#7B9EA8]/10 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         View Profile
                       </button>
                       <button onClick={() => alert("More options clicked")} className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3A3F4D]">
                         <MoreHorizontal size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No users matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="py-3 px-4 border-t border-[#3A3F4D] text-sm text-gray-400 flex justify-between items-center bg-[#1C2128]/50">
           <span>Showing 1 to {filteredUsers.length} of {MOCK_USERS.length} users</span>
           <div className="flex gap-1">
             <button className="px-3 py-1 border border-[#3A3F4D] rounded text-gray-500 cursor-not-allowed">Prevent</button>
             <button className="px-3 py-1 border border-[#3A3F4D] bg-[#242834] text-white rounded">1</button>
             <button className="px-3 py-1 border border-[#3A3F4D] rounded text-gray-500 cursor-not-allowed">Next</button>
           </div>
        </div>
      </div>

      {/* Slide-over Profile Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
           <div className="relative z-50 w-full max-w-sm bg-[#0D1117] border-l border-[#1C2128] h-full shadow-2xl flex flex-col transform transition-transform duration-300">
             
             <div className="p-4 flex items-center justify-between border-b border-[#1C2128]">
                <h2 className="text-lg font-semibold text-white">User Profile</h2>
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-[#1C2128] rounded text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-accent-sage flex items-center justify-center text-xl font-bold text-white uppercase">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white leading-tight">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold border rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                          {selectedUser.role.replace('_', ' ')}
                       </span>
                       <span className="text-xs text-gray-500">•</span>
                       <span className={`text-xs flex items-center gap-1.5 ${selectedUser.status === 'Active' ? 'text-green-400' : 'text-gray-500'}`}>
                          {selectedUser.status}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-400 mb-8 space-y-1">
                   <p>Joined: <span className="text-gray-200">{selectedUser.joinDate}</span></p>
                   <p>Last login: <span className="text-gray-200">{selectedUser.lastLogin}</span></p>
                </div>

                <div className="bg-[#1C2128] rounded-lg p-4 mb-8">
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Engagement Summary (Aggregate)</h4>
                   <ul className="space-y-2 text-sm text-gray-300">
                     <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#7B9EA8] rounded-full"></span> Enrolled in 3 courses</li>
                     <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#7B9EA8] rounded-full"></span> Avg progress: 37%</li>
                     <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#7B9EA8] rounded-full"></span> Active 4 of last 7 days</li>
                     <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#7B9EA8] rounded-full"></span> Mood this week: mostly Good</li>
                     <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#7B9EA8] rounded-full"></span> Goals: 2 active, 1 completed</li>
                     <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#7B9EA8] rounded-full"></span> Coach messages this week: 2</li>
                   </ul>
                </div>

                <div className="bg-[#C9544D]/10 border border-[#C9544D]/20 p-3 rounded text-xs text-[#C9544D] flex items-start gap-2">
                   <Lock size={14} className="mt-0.5 shrink-0" />
                   <p>NOTE: Individual conversations and reflections are private and not shown.</p>
                </div>
             </div>

             {(isAdminOrSuper) && (
             <div className="p-4 border-t border-[#1C2128] bg-[#0B0E14] space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Actions</h4>
                <div className="flex gap-2">
                  <button onClick={() => alert(selectedUser.status === 'Active' ? "Account disabled" : "Account enabled")} className="flex-1 py-2 text-sm border border-[#3A3F4D] hover:bg-[#1C2128] rounded text-gray-300">
                    {selectedUser.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                  </button>
                  {isSuper && (
                    <button onClick={() => alert("Change role clicked")} className="flex-1 py-2 text-sm border border-[#3A3F4D] hover:bg-[#1C2128] rounded text-gray-300 flex items-center justify-center gap-2">
                      Change Role <ChevronDown size={14} />
                    </button>
                  )}
                </div>
             </div>
             )}

           </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
           <div className="bg-[#0D1117] border border-[#1C2128] rounded-xl w-full max-w-md relative z-50 p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Add New User</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowAddModal(false); }}>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Email <span className="text-[#C9544D]">*</span></label>
                   <input type="email" required placeholder="user@example.com" className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-3 py-2 text-white focus:border-[#7B9EA8] outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Full Name (Options)</label>
                   <input type="text" placeholder="John Doe" className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-3 py-2 text-white focus:border-[#7B9EA8] outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                   <select className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-3 py-2 text-white outline-none focus:border-[#7B9EA8]">
                      <option value="student">Student</option>
                      {isSuper && <option value="support_staff">Support Staff</option>}
                      
                      {isSuper && <option value="super_admin">Admin</option>}
                   </select>
                 </div>
                 <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-[#1C2128]">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-[#7B9EA8] text-[#0D1117] font-medium rounded hover:bg-[#A3BFC7]">Send Invite</button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};
