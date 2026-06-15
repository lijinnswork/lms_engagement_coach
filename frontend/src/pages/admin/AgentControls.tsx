import React, { useState, useEffect } from 'react';
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
import { fetchWithAuth } from '../../stores/authStore';

export const AgentControls: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [decisionStats, setDecisionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    run_interval: 4,
    lms_refresh_interval: 2,
    default_max_messages: 3,
    min_gap: 24
  });

  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const statusRes = await fetchWithAuth('/api/admin/agents/status');
      if (statusRes.ok) {
        const d = await statusRes.json();
        setSchedulerStatus(d);
      }

      // Load prompt
      const promptRes = await fetchWithAuth('/api/admin/coach-studio/prompt');
      if (promptRes.ok) {
        const d = await promptRes.json();
        setSystemPrompt(d.draft_prompt || d.active_prompt || 'You are the user\'s supportive learning coach.');
      }

      // Load watchers list
      const watchersRes = await fetchWithAuth('/api/admin/coach-studio/watchers');
      if (watchersRes.ok) {
        const d = await watchersRes.json();
        const mapped = [
          { name: 'engagement', label: 'Engagement', enabled: d.engagement?.active ?? true, lastTrigger: d.engagement?.last_trigger ?? '—', messages: d.engagement?.messages_count ?? 0, status: d.engagement?.active ? 'Active' : 'Disabled' },
          { name: 'momentum', label: 'Momentum', enabled: d.momentum?.active ?? true, lastTrigger: d.momentum?.last_trigger ?? '—', messages: d.momentum?.messages_count ?? 0, status: d.momentum?.active ? 'Active' : 'Disabled' },
          { name: 'goal_progress', label: 'Goal Progress', enabled: d.goal_progress?.active ?? true, lastTrigger: d.goal_progress?.last_trigger ?? '—', messages: d.goal_progress?.messages_count ?? 0, status: d.goal_progress?.active ? 'Active' : 'Disabled' },
          { name: 'curiosity', label: 'Curiosity', enabled: d.curiosity?.active ?? true, lastTrigger: d.curiosity?.last_trigger ?? '—', messages: d.curiosity?.messages_count ?? 0, status: d.curiosity?.active ? 'Active' : 'Disabled' }
        ];
        setAgents(mapped);
      }

      // Gemini connection checks
      const geminiRes = await fetchWithAuth('/api/admin/agents/gemini-status');
      if (geminiRes.ok) {
        const d = await geminiRes.json();
        setGeminiStatus(d);
      }

      // Load Settings
      const settingsRes = await fetchWithAuth('/api/admin/agents/settings');
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        setSettings(d);
      } else {
        // Fallback behavior settings
        const behaviorRes = await fetchWithAuth('/api/admin/coach-studio/behavior');
        if (behaviorRes.ok) {
          const d = await behaviorRes.json();
          setSettings({
            run_interval: d.run_interval ?? 4,
            lms_refresh_interval: d.lms_refresh_interval ?? 2,
            default_max_messages: d.default_nudge_frequency ?? 3,
            min_gap: d.min_gap_hours ?? 24
          });
        }
      }

      // Load Decision Stats
      const decisionRes = await fetchWithAuth('/api/admin/agents/decision-stats?period=24h');
      if (decisionRes.ok) {
        const d = await decisionRes.json();
        setDecisionStats(d);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAgent = async (idx: number) => {
    const target = agents[idx];
    const nextVal = !target.enabled;
    const updated = [...agents];
    updated[idx].enabled = nextVal;
    updated[idx].status = nextVal ? 'Active' : 'Disabled';
    setAgents(updated);

    try {
      await fetchWithAuth(`/api/admin/agents/${target.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextVal })
      });
      await fetchWithAuth(`/api/admin/coach-studio/watchers/${target.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextVal })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const runSchedulerNow = async () => {
    if (confirm("This will run all agents for all users. This may take a few minutes. Continue?")) {
      try {
        const res = await fetchWithAuth('/api/admin/agents/run-now', { method: 'POST' });
        if (res.ok) {
          alert("Scheduler triggered successfully.");
          loadData();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePauseResume = async (nextState: 'Running' | 'Paused') => {
    try {
      const url = nextState === 'Running' ? '/api/admin/agents/resume' : '/api/admin/agents/pause';
      await fetchWithAuth(url, { method: 'POST' });
      setSchedulerStatus((prev: any) => prev ? { ...prev, scheduler: nextState } : { scheduler: nextState });
      alert(`Scheduler ${nextState === 'Running' ? 'resumed' : 'paused'} successfully.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await fetchWithAuth('/api/admin/agents/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      await fetchWithAuth('/api/admin/coach-studio/behavior', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_interval: settings.run_interval,
          lms_refresh_interval: settings.lms_refresh_interval,
          default_nudge_frequency: settings.default_max_messages,
          min_gap_hours: settings.min_gap
        })
      });
      alert("Global settings saved successfully.");
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error saving settings.");
    }
  };

  const saveLivePrompt = async () => {
    try {
      await fetchWithAuth('/api/admin/coach-studio/prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: systemPrompt })
      });
      alert("Prompt updated successfully.");
      setShowPromptEditor(false);
    } catch (e) {
      console.error(e);
    }
  };

  const schedulerActive = (schedulerStatus?.scheduler ?? 'Running') === 'Running';

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
                     <span className={`w-2 h-2 rounded-full ${schedulerActive ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                     <span className="text-gray-200 font-medium">{schedulerActive ? 'Running' : 'Paused'}</span>
                  </div>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Last run</span>
                  <span className="text-gray-200 font-medium">{schedulerStatus?.last_run ?? '—'}</span>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Next run</span>
                  <span className="text-gray-200 font-medium">{schedulerStatus?.next_run ?? '—'}</span>
               </div>
               <div>
                  <span className="text-sm text-gray-400 block mb-1">Cycle</span>
                  <span className="text-gray-200 font-medium">every {settings.run_interval} hours</span>
               </div>
            </div>

            <div className="bg-[#1C2128] rounded p-3 mb-6 flex justify-around text-sm">
               <div className="text-center">
                 <p className="text-gray-400">Users processed</p>
                 <p className="text-white font-bold">{schedulerStatus?.users_processed ?? 0}</p>
               </div>
               <div className="text-center">
                 <p className="text-gray-400">Messages sent</p>
                 <p className="text-white font-bold">{schedulerStatus?.messages_sent ?? 0}</p>
               </div>
               <div className="text-center">
                 <p className="text-gray-400">Errors</p>
                 <p className="text-green-400 font-bold">{schedulerStatus?.errors_count ?? 0}</p>
               </div>
            </div>

            <div className="flex gap-3">
               {schedulerActive ? (
                 <button onClick={() => handlePauseResume('Paused')} className="flex items-center gap-2 px-4 py-2 border border-[#3A3F4D] text-gray-300 hover:text-white rounded transition-colors bg-[#1C2128]">
                   <Pause size={16} /> Pause Scheduler
                 </button>
               ) : (
                 <button onClick={() => handlePauseResume('Running')} className="flex items-center gap-2 px-4 py-2 border border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded transition-colors">
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
                     <td className="py-3 px-5 font-medium capitalize">{agent.name}</td>
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
                  {geminiStatus?.status === 'Connected' || (geminiStatus && !geminiStatus.error) ? (
                    <div className="flex items-center gap-1.5 text-green-400">
                      <CheckCircle2 size={14} /> Connected
                    </div>
                  ) : (
                    <div className="text-red-400 text-xs flex items-center gap-1 font-medium">
                      Not configured — add your Gemini API key in .env
                    </div>
                  )}
               </div>
                <div>
                   <span className="text-sm text-gray-400 block mb-1">Avg response time</span>
                   <span className="text-gray-200">{geminiStatus?.response_time ?? '—'}</span>
                </div>
                <div>
                   <span className="text-sm text-gray-400 block mb-1">Tokens today</span>
                   <span className="text-gray-200">{geminiStatus?.tokens_today ? `${geminiStatus.tokens_today} (estimated)` : '—'}</span>
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
               <p className="text-xs text-gray-500 italic mb-2">Configure system personality instructions.</p>
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
                  <input type="number" value={settings.run_interval} onChange={e=>setSettings({...settings, run_interval: parseInt(e.target.value) || 4})} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">LMS refresh interval (hours)</span>
                  <input type="number" value={settings.lms_refresh_interval} onChange={e=>setSettings({...settings, lms_refresh_interval: parseInt(e.target.value) || 2})} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Default max messages/week</span>
                  <input type="number" value={settings.default_max_messages} onChange={e=>setSettings({...settings, default_max_messages: parseInt(e.target.value) || 3})} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Min gap between messages</span>
                  <div className="flex items-center gap-2">
                    <input type="number" value={settings.min_gap} onChange={e=>setSettings({...settings, min_gap: parseInt(e.target.value) || 24})} className="w-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-center outline-none focus:border-[#7B9EA8]" />
                    <span className="text-sm text-gray-500">hours</span>
                  </div>
               </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full py-2 bg-[#1C2128] border border-[#3A3F4D] text-sm text-gray-300 hover:text-white rounded hover:bg-[#3A3F4D] transition-colors">
               Save Settings
            </button>
          </div>

          {/* Decision Engine */}
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Decision Engine Stats (24h)</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                 <li>• {decisionStats?.users_evaluated ?? 0} users evaluated</li>
                 <li>• {decisionStats?.stayed_silent ?? 0} stayed silent (no triggers)</li>
                 <li>• {decisionStats?.blocked ?? 0} had triggers but blocked by constraints</li>
                 <ul className="pl-6 text-gray-500 space-y-1 mt-1 text-xs list-disc font-sans">
                    <li>{decisionStats?.blocked_limit ?? 0} blocked by weekly limit</li>
                    <li>{decisionStats?.blocked_quiet ?? 0} blocked by quiet hours</li>
                    <li>{decisionStats?.blocked_gap ?? 0} blocked by 24h min gap</li>
                    <li>{decisionStats?.blocked_overwhelmed ?? 0} blocked by overwhelmed pause</li>
                 </ul>
                 <li className="pt-1 text-[#B4C7B8]">• {decisionStats?.messages_sent ?? 0} messages sent</li>
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
                 <button onClick={saveLivePrompt} className="px-4 py-2 bg-[#7B9EA8] text-[#0D1117] font-medium rounded hover:bg-[#A3BFC7]">Save & Apply Live</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
