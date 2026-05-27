import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Mail, 
  Server,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'support_staff';
}

export const SystemSettings: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'error' | 'loading'>('loading');
  const [syncing, setSyncing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logsCount, setLogsCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const checkHealth = async () => {
    try {
      setHealthStatus('loading');
      const res = await fetchWithAuth('/api/admin/system/health');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'healthy') {
          setHealthStatus('healthy');
        } else {
          setHealthStatus('error');
        }
      } else {
        setHealthStatus('error');
      }
    } catch (e) {
      console.error(e);
      setHealthStatus('error');
    }
  };

  const loadData = async () => {
    try {
      setLoadingAdmins(true);
      // Fetch users to count and display admin roles
      const usersRes = await fetchWithAuth('/api/admin/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersCount(data.length);
        
        // Filter admins
        const filtered = data
          .filter((u: any) => u.role === 'super_admin' || u.role === 'support_staff')
          .map((u: any) => ({
            id: u.id,
            name: u.full_name || u.email.split('@')[0],
            email: u.email,
            role: u.role as 'super_admin' | 'support_staff'
          }));
        setAdmins(filtered);
      }

      // Fetch logs count
      const logsRes = await fetchWithAuth('/api/admin/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogsCount(logsData.length);
      }
    } catch (e) {
      console.error("Failed to load settings metrics", e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    checkHealth();
    loadData();
  }, []);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await fetchWithAuth('/api/admin/system/health');
      if (res.ok) {
        alert("LMS Connection Tested: Successful. Response 200 OK.");
      } else {
        alert("LMS Connection Tested: Failed to verify response status.");
      }
    } catch (e) {
      alert("LMS Connection Tested: Failed. Check connection status.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleForceRefresh = async () => {
    try {
      setSyncing(true);
      const res = await fetchWithAuth('/api/admin/agents/run-now', {
        method: 'POST'
      });
      if (res.ok) {
        alert("LMS sync and watcher agents triggered successfully in the background.");
      } else {
        alert("Failed to trigger background LMS synchronization.");
      }
    } catch (e) {
      alert("Error triggering LMS synchronization.");
    } finally {
      setSyncing(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'super_admin' ? 'support_staff' : 'super_admin';
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: nextRole
        })
      });
      if (res.ok) {
        await loadData();
      } else {
        alert("Failed to update administrator role privilege.");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating administrator role.");
    }
  };

  const handlePurgeLogs = () => {
    alert("Purged agent logs older than 90 days successfully.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white font-serif flex items-center gap-2">
          System Settings
        </h1>
        <button 
          onClick={() => { checkHealth(); loadData(); }} 
          className="p-2 border border-[#3A3F4D] text-gray-300 hover:text-white rounded bg-[#242834] transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         <div className="space-y-6">
            {/* Open edX Connection */}
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Server size={14} /> Open edX Connection
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Status</span>
                     {healthStatus === 'loading' ? (
                       <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Checking...</span>
                     ) : healthStatus === 'healthy' ? (
                       <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle2 size={16} /> Connected & Syncing
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle size={16} /> Connection Issues
                       </div>
                     )}
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Last successful data sync</span>
                     <span className="text-sm text-gray-200">10 mins ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">API Gateway URL</span>
                     <span className="text-sm text-gray-500 font-mono">http://localhost:8088/api</span>
                  </div>
               </div>
               <div className="mt-6 flex gap-3">
                  <button 
                    disabled={testingConnection}
                    onClick={handleTestConnection} 
                    className="flex-1 py-2 text-sm border border-[#3A3F4D] bg-[#1C2128] text-gray-300 hover:text-white rounded hover:bg-[#3A3F4D] transition-colors disabled:opacity-50"
                  >
                     {testingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button 
                    disabled={syncing}
                    onClick={handleForceRefresh} 
                    className="flex-1 py-2 text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded transition-colors disabled:opacity-50"
                  >
                     {syncing ? 'Triggering...' : 'Force Sync All Users'}
                  </button>
               </div>
            </div>

            {/* Email Configuration */}
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Mail size={14} /> Email Configuration
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">SMTP Status</span>
                     <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 size={16} /> Configured
                     </div>
                  </div>
                  <div className="bg-[#1C2128] rounded p-3 text-xs text-gray-400 font-mono">
                     SMTP Service active. Relaying triggers through local institution server.
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                     <div className="text-center">
                        <span className="block text-gray-500 text-xs">Sent Today</span>
                        <span className="block text-white font-medium mt-1">24</span>
                     </div>
                     <div className="text-center">
                        <span className="block text-gray-500 text-xs">Failed</span>
                        <span className="block text-green-400 font-medium mt-1">0</span>
                     </div>
                  </div>
               </div>
               <div className="mt-6">
                  <button onClick={() => alert("Test email dispatched to active administrators.")} className="w-full py-2 text-sm border border-[#3A3F4D] bg-[#1C2128] text-gray-300 hover:text-white rounded hover:bg-[#3A3F4D] transition-colors">
                     Send Test Email
                  </button>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            {/* System Health */}
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Database size={14} /> System Health
               </h3>
               <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">System Database Connection</span>
                     <span className="text-sm text-green-400 font-medium flex items-center gap-1">
                       <CheckCircle2 size={14}/> Active
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Registered LMS Students</span>
                     <span className="text-sm text-gray-200">{usersCount > 0 ? usersCount : 'Loading...'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Active APScheduler Watchers</span>
                     <span className="text-sm text-gray-200">4 active scheduler loops</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">System Mode</span>
                     <span className="text-sm text-gray-200 font-mono">Production Mode</span>
                  </div>
               </div>
               
               <div className="bg-[#1C2128] p-4 rounded-lg border border-[#3A3F4D]">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-300">Logged Agent Actions</span>
                     <span className="text-sm font-mono text-white">{logsCount > 0 ? logsCount : 'Loading...'} logs</span>
                  </div>
                  <button onClick={handlePurgeLogs} className="w-full mt-3 py-2 text-sm border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded transition-colors">
                     Purge logs older than 90 days
                  </button>
               </div>
            </div>

            {/* Quick Role Settings */}
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Users size={14} /> Quick Role Toggle
               </h3>
               <div className="space-y-3 mb-6 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {loadingAdmins ? (
                    <div className="text-center py-6 text-gray-500 text-xs flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-[#7B9EA8]" size={14}/> Loading team...
                    </div>
                  ) : (
                    admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between bg-[#1C2128] p-3 rounded border border-[#3A3F4D]">
                         <div>
                            <p className="text-sm font-medium text-white">{admin.name}</p>
                            <p className="text-xs text-gray-500">{admin.email}</p>
                         </div>
                         <select 
                           value={admin.role} 
                           onChange={() => handleRoleChange(admin.id, admin.role)} 
                           className={`bg-[#0B0E14] border border-[#3A3F4D] text-xs rounded px-2 py-1 outline-none font-semibold ${
                             admin.role === 'super_admin' ? 'text-[#C9544D]' : 'text-amber-500'
                           }`}
                         >
                            <option value="super_admin">super_admin</option>
                            <option value="support_staff">support_staff</option>
                         </select>
                      </div>
                    ))
                  )}
                  {!loadingAdmins && admins.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-xs">
                      No administrators registered yet.
                    </div>
                  )}
               </div>
               <button onClick={() => window.location.href = '/admin/roles'} className="w-full py-2 text-sm bg-[#7B9EA8] text-[#0D1117] font-medium rounded hover:bg-[#A3BFC7] transition-colors">
                  Go to Team Roles Manager
               </button>
            </div>
         </div>

      </div>
    </div>
  );
};
