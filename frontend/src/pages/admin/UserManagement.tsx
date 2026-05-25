import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  MoreHorizontal, 
  X,
  ChevronDown,
  Lock,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuthStore, fetchWithAuth } from '../../stores/authStore';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Disabled';
  lastLogin: string;
  joinDate: string;
  lms_username: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isAdminOrSuper = ['super_admin'].includes(currentUser?.role || '');
  const isSuper = currentUser?.role === 'super_admin';

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLmsUsername, setEditLmsUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load users from backend
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth('/api/admin/users');
      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Map API models to Frontend format
      const mapped: UserData[] = data.map((u: any) => {
        const join = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }) : 'Unknown';
        
        let lastLog = 'Never';
        if (u.last_login) {
          const diffMs = Date.now() - new Date(u.last_login).getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHrs = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHrs / 24);
          
          if (diffMins < 1) lastLog = 'Just now';
          else if (diffMins < 60) lastLog = `${diffMins}m ago`;
          else if (diffHrs < 24) lastLog = `${diffHrs}h ago`;
          else lastLog = `${diffDays}d ago`;
        }

        return {
          id: u.id,
          name: u.full_name || 'No Name',
          email: u.email,
          role: u.role || 'student',
          status: u.is_active ? 'Active' : 'Disabled',
          lastLogin: lastLog,
          joinDate: join,
          lms_username: u.lms_username || ''
        };
      });

      setUsers(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch users from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Update user username/name logic
  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    try {
      setIsSaving(true);
      const res = await fetchWithAuth(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editName,
          lms_username: editLmsUsername
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      const updated = await res.json();
      
      // Update local state
      setSelectedUser(prev => prev ? {
        ...prev,
        name: updated.full_name,
        lms_username: updated.lms_username || ''
      } : null);

      setIsEditing(false);
      await loadUsers(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to update user changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (targetUser: UserData) => {
    try {
      const nextStatus = targetUser.status === 'Active' ? 'Disabled' : 'Active';
      const res = await fetchWithAuth(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update user status');
      }

      // Update selected profile view if open
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser(prev => prev ? { ...prev, status: nextStatus } : null);
      }

      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle account status.');
    }
  };

  // Delete user account permanently
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setIsDeleting(true);
      const res = await fetchWithAuth(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete user');
      }

      setSelectedUser(null);
      setShowDeleteConfirm(false);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open profile view panel
  const handleSelectUser = (targetUser: UserData) => {
    setSelectedUser(targetUser);
    setEditName(targetUser.name);
    setEditLmsUsername(targetUser.lms_username);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  };

  // Filtering logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.lms_username.toLowerCase().includes(search.toLowerCase());
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

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-white font-serif">User Management</h1>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name, email, or LMS username..."
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

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#242834] border border-[#3A3F4D] rounded-xl flex-1">
          <Loader2 size={36} className="animate-spin text-[#7B9EA8] mb-3" />
          <span className="text-gray-400">Loading directory...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#242834] border border-[#3A3F4D] rounded-xl flex-1 text-center">
          <AlertTriangle size={36} className="text-red-400 mb-3" />
          <span className="text-red-400 font-medium mb-1">{error}</span>
          <button onClick={loadUsers} className="mt-2 text-[#7B9EA8] hover:underline">Try Again</button>
        </div>
      ) : (
        /* Table */
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3A3F4D] text-sm text-gray-400 bg-[#1C2128]/50">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">LMS Username</th>
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
                    <td className="py-3 px-4 text-[#7B9EA8] font-mono text-sm">{u.lms_username || '—'}</td>
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
                           onClick={() => handleSelectUser(u)}
                           className="text-sm font-medium text-[#7B9EA8] hover:text-white px-2 py-1 rounded hover:bg-[#7B9EA8]/10 opacity-0 group-hover:opacity-100 transition-all font-serif"
                         >
                           Manage Account
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No users matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="py-3 px-4 border-t border-[#3A3F4D] text-sm text-gray-400 flex justify-between items-center bg-[#1C2128]/50">
             <span>Showing {filteredUsers.length} users</span>
          </div>
        </div>
      )}

      {/* Slide-over Profile Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if(!isSaving && !isDeleting) setSelectedUser(null); }} />
           <div className="relative z-50 w-full max-w-md bg-[#0D1117] border-l border-[#1C2128] h-full shadow-2xl flex flex-col transform transition-transform duration-300">
             
             <div className="p-4 flex items-center justify-between border-b border-[#1C2128]">
                <h2 className="text-lg font-semibold text-white">Manage Account</h2>
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-[#1C2128] rounded text-gray-400 hover:text-white" disabled={isSaving || isDeleting}>
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Header view */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#7B9EA8]/20 flex items-center justify-center text-xl font-bold text-[#7B9EA8] uppercase">
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
                       <span className={`text-xs flex items-center gap-1.5 ${selectedUser.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedUser.status}
                       </span>
                    </div>
                  </div>
                </div>

                <hr className="border-[#1C2128]" />

                {/* Edit Form */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Information</h4>
                    {!isEditing && isAdminOrSuper && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-[#7B9EA8] hover:underline flex items-center gap-1"
                      >
                        <Edit2 size={12} /> Edit Details
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 p-4 bg-[#1C2128] rounded-xl border border-[#3A3F4D]/50">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                        <input 
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#0D1117] border border-[#3A3F4D] rounded px-3 py-1.5 text-white text-sm focus:border-[#7B9EA8] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">LMS Username</label>
                        <input 
                          type="text"
                          value={editLmsUsername}
                          onChange={(e) => setEditLmsUsername(e.target.value)}
                          className="w-full bg-[#0D1117] border border-[#3A3F4D] rounded px-3 py-1.5 text-white text-sm focus:border-[#7B9EA8] outline-none font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => {
                            setEditName(selectedUser.name);
                            setEditLmsUsername(selectedUser.lms_username);
                            setIsEditing(false);
                          }}
                          className="px-3 py-1 text-xs text-gray-400 hover:text-white rounded"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveChanges}
                          className="px-3 py-1 text-xs bg-[#7B9EA8] text-[#0D1117] hover:bg-[#A3BFC7] font-semibold rounded flex items-center gap-1"
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-500">LMS Username:</span>
                        <span className="font-mono text-[#7B9EA8]">{selectedUser.lms_username || 'Not Linked'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Joined:</span>
                        <span>{selectedUser.joinDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last login:</span>
                        <span>{selectedUser.lastLogin}</span>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-[#1C2128]" />

                {/* Privacy Warning */}
                <div className="bg-[#C9544D]/10 border border-[#C9544D]/20 p-3 rounded text-xs text-[#C9544D] flex items-start gap-2">
                   <Lock size={14} className="mt-0.5 shrink-0" />
                   <p>Privacy Notice: Individual coach conversations and private student goals are shielded and never visible to platform administrators.</p>
                </div>

                {/* Actions Panel */}
                {isAdminOrSuper && (
                  <div className="pt-4 border-t border-[#1C2128] space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Actions</h4>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleStatus(selectedUser)} 
                        className={`flex-1 py-2 text-sm border border-[#3A3F4D] hover:bg-[#1C2128] rounded font-medium ${selectedUser.status === 'Active' ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'}`}
                      >
                        {selectedUser.status === 'Active' ? 'Deactivate Account' : 'Reactivate Account'}
                      </button>
                    </div>

                    {isSuper && (
                      <div className="pt-2">
                        {showDeleteConfirm ? (
                          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-3">
                            <div className="flex gap-2 text-red-500 text-sm font-medium">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <span>Permanently delete {selectedUser.name}? This removes all goals, reminders, sync cache, and chat records. This cannot be undone.</span>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 text-xs border border-[#3A3F4D] hover:bg-[#1C2128] text-gray-300 rounded"
                                disabled={isDeleting}
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleDeleteUser}
                                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white font-semibold rounded flex items-center gap-1"
                                disabled={isDeleting}
                              >
                                {isDeleting && <Loader2 size={12} className="animate-spin" />}
                                Delete Forever
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-2 text-sm bg-red-600/20 hover:bg-red-600 text-red-200 rounded font-medium flex items-center justify-center gap-2 border border-red-600/40 hover:border-red-600 transition-colors"
                          >
                            <Trash2 size={14} /> Delete Account Permanently
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

             </div>
           </div>
        </div>
      )}

    </div>
  );
};
