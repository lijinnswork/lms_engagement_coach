import React from 'react';
import { 
  Database, 
  Mail, 
  Server,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white font-serif">System Settings</h1>
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
                     <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 size={16} /> Connected
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Last successful data sync</span>
                     <span className="text-sm text-gray-200">10 mins ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">API Base URL</span>
                     <span className="text-sm text-gray-500 font-mono">https://lms.example.com</span>
                  </div>
               </div>
               <div className="mt-6 flex gap-3">
                  <button onClick={() => alert("Connection tested successfully")} className="flex-1 py-2 text-sm border border-[#3A3F4D] bg-[#1C2128] text-gray-300 hover:text-white rounded hover:bg-[#3A3F4D] transition-colors">
                     Test Connection
                  </button>
                  <button onClick={() => alert("Force refresh triggered")} className="flex-1 py-2 text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded transition-colors">
                     Force Refresh All Users
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
                     <div className="flex items-center gap-2 text-amber-500 text-sm">
                        <AlertCircle size={16} /> Error
                     </div>
                  </div>
                  <div className="bg-[#1C2128] rounded p-3 text-xs text-gray-500 font-mono">
                     ConnectionRefusedError: [Errno 111] Connection refused
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="text-center">
                        <span className="block text-gray-400">Sent Today</span>
                        <span className="block text-white font-medium mt-1">24</span>
                     </div>
                     <div className="text-center">
                        <span className="block text-gray-400">Failed</span>
                        <span className="block text-red-400 font-medium mt-1">3</span>
                     </div>
                  </div>
               </div>
               <div className="mt-6">
                  <button onClick={() => alert("Test email sent")} className="w-full py-2 text-sm border border-[#3A3F4D] bg-[#1C2128] text-gray-300 hover:text-white rounded hover:bg-[#3A3F4D] transition-colors">
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
                     <span className="text-sm text-gray-400">Database Size</span>
                     <span className="text-sm text-gray-200">142.5 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">LMS Data Cache Entries</span>
                     <span className="text-sm text-gray-200">842</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Active APScheduler Jobs</span>
                     <span className="text-sm text-gray-200">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-400">Memory Usage</span>
                     <span className="text-sm text-gray-200">284 MB</span>
                  </div>
               </div>
               
               <div className="bg-[#1C2128] p-4 rounded-lg border border-[#3A3F4D]">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-300">Agent Log Entries</span>
                     <span className="text-sm font-mono text-white">4,832</span>
                  </div>
                  <button onClick={() => alert("Logs purged")} className="w-full mt-3 py-2 text-sm border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded transition-colors">
                     Purge logs older than 90 days
                  </button>
               </div>
            </div>

            {/* Role Management */}
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Users size={14} /> Role Management
               </h3>
               <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-[#1C2128] p-3 rounded border border-[#3A3F4D]">
                     <div>
                        <p className="text-sm font-medium text-white">Admin User</p>
                        <p className="text-xs text-gray-500">super@company.com</p>
                     </div>
                     <select onChange={() => alert("Role changed")} className="bg-[#0B0E14] border border-[#3A3F4D] text-[#C9544D] text-xs rounded px-2 py-1 outline-none">
                        <option>super_admin</option>
                     </select>
                  </div>
                  <div className="flex items-center justify-between bg-[#1C2128] p-3 rounded border border-[#3A3F4D]">
                     <div>
                        <p className="text-sm font-medium text-white">Sarah Chen</p>
                        <p className="text-xs text-gray-500">sarah@company.com</p>
                     </div>
                     <select onChange={() => alert("Role changed")} className="bg-[#0B0E14] border border-[#3A3F4D] text-gray-400 text-xs rounded px-2 py-1 outline-none">
                        <option>support_staff</option>
                        
                        <option>super_admin</option>
                     </select>
                  </div>
               </div>
               <button onClick={() => alert("Add Admin clicked")} className="w-full py-2 text-sm bg-[#7B9EA8] text-[#0D1117] font-medium rounded hover:bg-[#A3BFC7] transition-colors">
                  + Add Admin
               </button>
            </div>
         </div>

      </div>
    </div>
  );
};
