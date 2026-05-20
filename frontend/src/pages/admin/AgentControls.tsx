import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Edit3, 
  X,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AgentControls: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<'Running' | 'Paused'>('Running');
  const [agents, setAgents] = useState([
    { name: 'Engagement', status: 'Active', lastTrigger: '2h ago', messages: 45, enabled: true },

    { name: 'Momentum', status: 'Active', lastTrigger: '1h ago', messages: 67, enabled: true },
    { name: 'Goal Progress', status: 'Dormant', lastTrigger: '—', messages: 0, enabled: true },
    { name: 'Curiosity', status: 'Active', lastTrigger: '6h ago', messages: 12, enabled: true },
  ]);

  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(`You are a responsive, encouraging, and highly observant AI coach embedded in an online learning platform.
Your objective is to help students overcome blocks, celebrate progress, and stay engaged.

Key Guidelines:
1. Be succinct, never over 500 characters.
2. NEVER explain complex topics directly (refer them back to the course).
3. Do not act like a friend, act like a professional coach.
4. Scale your tone based on the user's current mood signal.`);

  const toggleAgent = (idx: number) => {
    const updated = [...agents];
    updated[idx].enabled = !updated[idx].enabled;
    setAgents(updated);
  };

  const runSchedulerNow = () => {
    if (confirm("This will run all agents for all users. This may take a few minutes. Continue?")) {
      alert("Scheduler triggered.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white font-serif">Agent Controls</h1>
        </div>
        <div>
           <button 
             onClick={runSchedulerNow}
             className="flex items-center gap-2 px-4 py-2 bg-[#7B9EA8] text-[#0D1117] hover:bg-[#A3BFC7] font-medium rounded-md transition-colors"
           >
             <RefreshCw size={18} /> Run Now
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* System Status */}
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Server size={14} /> System Status
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Scheduler</span>
                  <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${schedulerStatus === 'Running' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                     <span className="text-gray-200 font-medium">{schedulerStatus}</span>
                  </div>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Last run</span>
                  <span className="text-gray-200 font-medium">45 min ago</span>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Next run</span>
                  <span className="text-gray-200 font-medium">in 3h 15min</span>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Cycle</span>
                  <span className="text-gray-200 font-medium">every 4 hours</span>
               </div>
            </div>

            <div className="bg-[#1C2128] rounded p-3 mb-6 flex justify-around text-sm">
               <div className="text-center">
                 <p className="text-gray-400">Users processed</p>
                 <p className="text-white font-bold">247</p>
               </div>
               <div className="text-center">
                 <p className="text-gray-400">Messages sent</p>
                 <p className="text-white font-bold">8</p>
               </div>
               <div className="text-center">
                 <p className="text-gray-400">Errors</p>
                 <p className="text-green-400 font-bold">0</p>
               </div>
            </div>

            <div className="flex gap-3">
               {schedulerStatus === 'Running' ? (
                 <button onClick={() => setSchedulerStatus('Paused')} className="flex items-center gap-2 px-4 py-2 border border-[#3A3F4D] text-gray-300 hover:text-white rounded transition-colors bg-[#1C2128]">
                   <Pause size={16} /> Pause Scheduler
                 </button>
               ) : (
                 <button onClick={() => setSchedulerStatus('Running')} className="flex items-center gap-2 px-4 py-2 border border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded transition-colors">
                   <Play size={16} /> Resume
                 </button>
               )}
            </div>
          </div>

          {/* Watcher Agents */}
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl overflow-hidden">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0 p-5 pb-3 border-b border-[#3A3F4D]">
               Watcher Agents
            </h3>
            <table className="w-full text-left text-sm">
               <thead className="bg-[#1C2128] text-gray-400 border-b border-[#3A3F4D]">
                 <tr>
                   <th className="py-2 px-5 font-normal">Agent</th>
                   <th className="py-2 px-5 font-normal">Status</th>
                   <th className="py-2 px-5 font-normal">Last Trigger</th>
                   <th className="py-2 px-5 font-normal whitespace-nowrap text-right">Toggle</th>
                 </tr>
               </thead>
               <tbody className="text-gray-300">
                 {agents.map((agent, i) => (
                   <tr key={i} className="border-b border-[#3A3F4D]/50 hover:bg-[#1C2128]">
                     <td className="py-3 px-5 font-medium">{agent.name}</td>
                     <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                           <span className={`w-1.5 h-1.5 rounded-full ${
                             !agent.enabled ? 'bg-red-500' :
                             agent.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                           }`}></span>
                           {agent.enabled ? agent.status : 'Disabled'}
                        </div>
                     </td>
                     <td className="py-3 px-5 text-gray-400">{agent.lastTrigger}</td>
                     <td className="py-3 px-5 text-right">
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" className="sr-only peer" checked={agent.enabled} onChange={() => toggleAgent(i)} />
                         <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7B9EA8]"></div>
                       </label>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* API Status */}
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Zap size={14} /> Gemini API
             </h3>
             <div className="grid grid-cols-2 gap-4 mb-5">
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Model</span>
                  <span className="text-gray-200">gemini-2.5-flash</span>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Status</span>
                  <div className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle2 size={14} /> Connected
                  </div>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Avg response time</span>
                  <span className="text-gray-200">2.3s</span>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Tokens today</span>
                  <span className="text-gray-200">12,450 <span className="text-gray-500 text-xs">(~$0.40/mo)</span></span>
               </div>
             </div>

             <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-lg p-4">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-medium text-gray-300">System Prompt</span>
                 <button 
                   onClick={() => setShowPromptEditor(true)}
                   className="text-sm text-[#7B9EA8] hover:text-[#A3BFC7] flex items-center gap-1"
                 >
                   <Edit3 size={14} /> View/Edit
                 </button>
               </div>
               <p className="text-xs text-gray-500 italic mb-2">Last edited: April 18, 2026</p>
               <div className="text-sm text-gray-400 line-clamp-2 pr-4">
                 "{systemPrompt}"
               </div>
             </div>
          </div>

          {/* Global Settings */}
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Global Settings</h3>
            
            <div className="space-y-4 mb-6">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Run interval (hours)</span>
                  <input type="number" defaultValue={4} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">LMS refresh interval (hours)</span>
                  <input type="number" defaultValue={2} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Default max messages/week</span>
                  <input type="number" defaultValue={3} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Min gap between messages</span>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={24} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
                    <span className="text-sm text-gray-500">hours</span>
                  </div>
               </div>
            </div>

            <button onClick={() => alert("Global settings saved.")} className="w-full py-2 bg-[#1C2128] border border-[#3A3F4D] text-sm text-gray-300 hover:text-white rounded hover:bg-[#3A3F4D] transition-colors">
               Save Settings
            </button>
          </div>

          {/* Decision Engine */}
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Decision Engine Stats (24h)</h3>
             <ul className="text-sm text-gray-300 space-y-2">
                <li>• 247 users evaluated</li>
                <li>• 198 stayed silent (no triggers)</li>
                <li>• 31 had triggers but blocked by constraints</li>
                <ul className="pl-6 text-gray-500 space-y-1 mt-1 text-xs list-disc">
                   <li>12 blocked by weekly limit</li>
                   <li>8 blocked by quiet hours</li>
                   <li>7 blocked by 24h min gap</li>
                   <li>4 blocked by overwhelmed pause</li>
                </ul>
                <li className="pt-1 text-[#B4C7B8]">• 18 messages sent</li>
             </ul>
          </div>

        </div>

      </div>

      {/* Editor Modal */}
      {showPromptEditor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPromptEditor(false)} />
           <div className="bg-[#0D1117] border border-[#1C2128] rounded-xl w-full max-w-2xl relative z-50 p-6 shadow-2xl flex flex-col h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Edit System Prompt</h2>
                <button onClick={() => setShowPromptEditor(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg mb-4 flex items-start gap-3 shrink-0">
                 <AlertCircle size={18} className="text-amber-500 mt-0.5" />
                 <p className="text-xs text-amber-200/80">
                   <strong>WARNING:</strong> Changing the system prompt affects how the coach speaks to ALL students. Test changes carefully as this overrides the base agent personality.
                 </p>
              </div>

              <textarea 
                 value={systemPrompt}
                 onChange={e => setSystemPrompt(e.target.value)}
                 className="flex-1 w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md p-4 text-gray-300 font-mono text-sm outline-none focus:border-[#7B9EA8] resize-none"
              />

              <div className="pt-4 flex justify-end gap-3 shrink-0">
                 <button onClick={() => setShowPromptEditor(false)} className="px-4 py-2 rounded text-gray-400 hover:text-white bg-[#1C2128]">Cancel</button>
                 <button onClick={() => { setShowPromptEditor(false); alert("Prompt updated successfully."); }} className="px-4 py-2 bg-[#7B9EA8] text-[#0D1117] font-medium rounded hover:bg-[#A3BFC7]">Save & Apply Live</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
