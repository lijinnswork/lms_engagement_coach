import React, { useState } from 'react';
import { Download, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';

interface AgentLog {
  id: string;
  time: string;
  agent: string;
  decision: 'speak' | 'stay_silent' | 'error' | 'sent';
  reasoning: string;
  details?: string;
  priority?: number;
}

const MOCK_LOGS: AgentLog[] = [
  { id: '1', time: '10:32 AM', agent: 'decision_engine', decision: 'speak', reasoning: 'Chose motivation (priority 2)', details: 'Overrode engagement_watcher.' },
  { id: '3', time: '10:33 AM', agent: 'delivery_service', decision: 'sent', reasoning: 'Delivered message to user [anon-id]', details: 'Message ID: msg_885994' },
  { id: '4', time: '10:32 AM', agent: 'engagement_watcher', decision: 'stay_silent', reasoning: 'Activity normal', details: 'LMS interaction registered 4 mins ago.' },
  { id: '5', time: '10:32 AM', agent: 'momentum_watcher', decision: 'stay_silent', reasoning: 'No milestones detected' },
  { id: '6', time: '09:15 AM', agent: 'decision_engine', decision: 'error', reasoning: 'Validation failed on generation', details: 'Tried to output math explanation.' }
];

export const AgentLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('All');
  const [decisionFilter, setDecisionFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>(MOCK_LOGS);

  React.useEffect(() => {
    fetchWithAuth('/api/admin/logs')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setLogs(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.reasoning.toLowerCase().includes(search.toLowerCase());
    const matchAgent = agentFilter === 'All' || log.agent === agentFilter;
    const matchDecision = decisionFilter === 'All' || log.decision === decisionFilter;
    return matchSearch && matchAgent && matchDecision;
  });

  const getDecisionColor = (decision: string) => {
    if (decision === 'speak' || decision === 'sent') return 'bg-green-500/10 text-green-400';
    if (decision === 'error') return 'bg-red-500/10 text-red-400';
    return 'text-gray-300';
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white font-serif">Agent Logs</h1>
        </div>
        <div>
           <button 
             onClick={() => alert('Exporting CSV...')}
             className="flex items-center gap-2 px-4 py-2 border border-[#3A3F4D] text-gray-300 hover:text-white rounded-md transition-colors bg-[#242834]"
           >
             <Download size={18} /> Export CSV
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Agent:</span>
            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-1.5 outline-none focus:border-[#7B9EA8]">
               <option value="All">All</option>

               <option value="engagement_watcher">engagement_watcher</option>
               <option value="momentum_watcher">momentum_watcher</option>
               <option value="decision_engine">decision_engine</option>
               <option value="delivery_service">delivery_service</option>
            </select>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Decision:</span>
            <select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)} className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-1.5 outline-none focus:border-[#7B9EA8]">
               <option value="All">All</option>
               <option value="speak">speak</option>
               <option value="stay_silent">stay_silent</option>
               <option value="sent">sent</option>
               <option value="error">error</option>
            </select>
         </div>
         <div className="relative flex-1">
           <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
           <input 
             type="text" 
             placeholder="Search by reasoning text..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md pl-9 pr-3 py-1.5 text-white outline-none focus:border-[#7B9EA8]" 
           />
         </div>
      </div>

      {/* Table */}
      <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
           <table className="w-full text-left text-sm">
             <thead className="bg-[#1C2128]/50 border-b border-[#3A3F4D] text-gray-400">
               <tr>
                 <th className="py-2 px-3 w-10"></th>
                 <th className="py-2 px-4 font-medium">Time</th>
                 <th className="py-2 px-4 font-medium">Agent</th>
                 <th className="py-2 px-4 font-medium">Decision</th>
                 <th className="py-2 px-4 font-medium">Reasoning</th>
               </tr>
             </thead>
             <tbody>
               {filteredLogs.map(log => (
                 <React.Fragment key={log.id}>
                   <tr 
                     onClick={() => toggleRow(log.id)}
                     className={`border-b border-[#3A3F4D] hover:bg-[#1C2128] cursor-pointer transition-colors ${
                       log.decision === 'speak' || log.decision === 'sent' ? 'bg-green-500/[0.02]' : 
                       log.decision === 'error' ? 'bg-red-500/[0.02]' : ''
                     }`}
                   >
                     <td className="py-3 px-3 text-gray-500">
                        {expandedRow === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                     </td>
                     <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{log.time}</td>
                     <td className="py-3 px-4 text-[#7B9EA8] font-mono whitespace-nowrap text-xs">{log.agent}</td>
                     <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${getDecisionColor(log.decision)}`}>
                           {log.decision}
                        </span>
                     </td>
                     <td className="py-3 px-4 text-gray-200">{log.reasoning}</td>
                   </tr>
                   {expandedRow === log.id && (
                     <tr className="bg-[#0B0E14] border-b border-[#3A3F4D]">
                       <td colSpan={5} className="py-4 px-10">
                         <div className="text-gray-400 font-mono text-xs whitespace-pre-wrap">
                           <span className="text-gray-500 block mb-1">// JSON Data</span>
                           {JSON.stringify({
                             id: log.id,
                             timestamp: '2026-04-18T' + log.time,
                             agent: log.agent,
                             decision: log.decision,
                             priority_score: log.priority || 0,
                             details: log.details || 'No additional details provided.'
                           }, null, 2)}
                         </div>
                       </td>
                     </tr>
                   )}
                 </React.Fragment>
               ))}
               {filteredLogs.length === 0 && (
                 <tr>
                   <td colSpan={5} className="py-8 text-center text-gray-500">No logs found matching your criteria.</td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
        <div className="py-3 px-4 border-t border-[#3A3F4D] text-sm text-gray-400 flex justify-between items-center bg-[#1C2128]/50">
           <span>Showing 1 to {filteredLogs.length} of 4,832 logs</span>
           <div className="flex gap-1">
             <button className="px-3 py-1 border border-[#3A3F4D] rounded text-gray-500 cursor-not-allowed">Prevent</button>
             <button className="px-3 py-1 border border-[#3A3F4D] bg-[#242834] text-white rounded">1</button>
             <button className="px-3 py-1 border border-[#3A3F4D] rounded hover:bg-[#1C2128] hover:text-white transition-colors">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};
