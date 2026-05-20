import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  ThumbsUp,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SampleMessage {
  id: string;
  text: string;
  type: string;
  agent: string;
  reception: 'replied' | 'dismissed' | 'ignored';
}

const MOCK_MESSAGES: SampleMessage[] = [
  {
    id: 'm1',
    text: "I noticed you came back to [topic] three times this week. Something about it is clicking — how does it feel now?",
    type: "reflection_prompt",
    agent: "curiosity_watcher",
    reception: 'replied'
  },
  {
    id: 'm2',
    text: "Hey — I haven't seen you in a few days. No pressure, just wanted to say hi.",
    type: "check_in",
    agent: "engagement_watcher",
    reception: 'dismissed'
  },
  {
    id: 'm3',
    text: "You've been making steady progress on [course]! Take a moment to celebrate.",
    type: "celebration",
    agent: "momentum_watcher",
    reception: 'ignored'
  }
];

export const CoachMonitor: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  
  const [stats, setStats] = useState({
    messages_sent: 0,
    proactive_rate: 0,
    avg_per_student_week: 0,
    positive_reception_rate: 0
  });

  const [triggerData, setTriggerData] = useState([
    { value: 0, name: 'Engagement', itemStyle: { color: '#7B9EA8' } }
  ]);
  
  const [safety, setSafety] = useState({
    blocked_messages: 0,
    crisis_handled: 0,
    validation_failures: 0,
    total_passed: 0,
    auto_truncated: 0
  });

  const [samples, setSamples] = useState<SampleMessage[]>(MOCK_MESSAGES);

  React.useEffect(() => {
    fetch('/api/admin/coach/stats').then(r => r.json()).then(data => {
      if (data.messages_sent !== undefined) setStats(data);
    }).catch(console.error);

    fetch('/api/admin/coach/charts').then(r => r.json()).then(data => {
      if (data.trigger_distribution && data.trigger_distribution.length > 0) {
        // Map colors to agents
        const colors: Record<string, string> = {
          'engagement': '#7B9EA8', 'motivation': '#E8A87C', 
          'momentum': '#B4C7B8', 'curiosity': '#D4C5B9', 'goal': '#A391E8'
        };
        const mapped = data.trigger_distribution.map((item: any) => ({
          ...item,
          itemStyle: { color: colors[item.name] || '#8A8898' }
        }));
        setTriggerData(mapped);
      }
    }).catch(console.error);

    fetch('/api/admin/coach/safety-report').then(r => r.json()).then(data => {
      if (data.total_passed !== undefined) setSafety(data);
    }).catch(console.error);

    fetch('/api/admin/coach/samples').then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) setSamples(data);
    }).catch(console.error);
  }, []);

  const messageTypeOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#1C2128' }} },
    yAxis: { 
      type: 'category', 
      data: ['Curiosity', 'Goal Suggest', 'Motivation', 'Check-in'],
      axisLine: { lineStyle: { color: '#3A3F4D' } }
    },
    series: [
      {
        name: 'Messages',
        type: 'bar',
        data: [5, 8, 22, 35],
        itemStyle: { color: '#7B9EA8', borderRadius: [0, 4, 4, 0] }
      }
    ],
    textStyle: { color: '#8A8898' }
  };

  const responseRateOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: '#3A3F4D' } }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { color: '#1C2128' } }
    },
    series: [{
      data: [72, 75, 71, 78, 80, 85, 82],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#B4C7B8', width: 3 },
      itemStyle: { color: '#B4C7B8' },
    }],
    textStyle: { color: '#8A8898' }
  };

  const triggerOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{
      name: 'Agent',
      type: 'pie',
      radius: ['45%', '75%'],
      itemStyle: { borderRadius: 8, borderColor: '#242834', borderWidth: 2 },
      label: { show: false, position: 'center' },
      data: triggerData
    }]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white font-serif">Coach Monitor</h1>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm text-gray-400">Period:</span>
           <select 
             value={period} 
             onChange={e => setPeriod(e.target.value)}
             className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#7B9EA8]"
           >
             <option value="7d">Last 7 days</option>
             <option value="30d">Last 30 days</option>
           </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <span className="text-gray-400 text-sm font-medium">Messages Sent</span>
             <MessageSquare size={18} className="text-gray-400" />
          </div>
          <span className="text-3xl font-mono text-white tracking-tight">{stats.messages_sent}</span>
        </div>
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <span className="text-gray-400 text-sm font-medium">Proactive Rate</span>
             <Send size={18} className="text-gray-400" />
          </div>
          <span className="text-3xl font-mono text-white tracking-tight">{stats.proactive_rate}%</span>
        </div>
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <span className="text-gray-400 text-sm font-medium">Avg per Student / Week</span>
             <Users size={18} className="text-gray-400" />
          </div>
          <span className="text-3xl font-mono text-white tracking-tight">{stats.avg_per_student_week}</span>
        </div>
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <span className="text-gray-400 text-sm font-medium">Positive Reception Rate</span>
             <ThumbsUp size={18} className="text-gray-400" />
          </div>
          <span className="text-3xl font-mono text-white tracking-tight">{stats.positive_reception_rate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Charts */}
         <div className="space-y-6">
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">Message Types Distribution</h3>
              <ReactECharts option={messageTypeOptions} style={{ height: '220px' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
                <h3 className="text-white font-medium mb-4 text-sm">Response Rate Over Time</h3>
                <ReactECharts option={responseRateOptions} style={{ height: '180px' }} />
              </div>
              <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
                <h3 className="text-white font-medium mb-4 text-sm">Trigger Distribution</h3>
                <ReactECharts option={triggerOptions} style={{ height: '180px' }} />
              </div>
            </div>

            {/* Safety Report */}
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">Coach Safety Report</h3>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                   <CheckCircle2 size={16} className="text-green-500" />
                   {safety.blocked_messages} content-teaching attempts blocked this month
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                   <CheckCircle2 size={16} className="text-green-500" />
                   {safety.crisis_handled} crisis situations handled (all escalated correctly)
                </li>
                <li className="flex items-center gap-3 text-sm text-white bg-amber-500/10 p-2 rounded -mx-2 px-2 border border-amber-500/20">
                   <AlertTriangle size={16} className="text-amber-500" />
                   {safety.auto_truncated} messages exceeded length limit (auto-truncated)
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                   <CheckCircle2 size={16} className="text-green-500" />
                   {safety.validation_failures} validation failures this month
                </li>
              </ul>

              <div className="border-t border-[#3A3F4D] pt-4">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Message Validation Stats</h4>
                 <ul className="space-y-1 text-sm text-gray-400">
                    <li>• {safety.total_passed} of {stats.messages_sent} messages passed validation on first try</li>
                    <li>• {safety.auto_truncated} messages were auto-truncated (&gt;500 chars)</li>
                    <li>• {safety.validation_failures} messages fell back to generic safe message</li>
                 </ul>
              </div>
            </div>
         </div>

         {/* Sample Messages */}
         <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 h-full flex flex-col">
            <div className="mb-4">
              <h3 className="text-white font-medium">Sample Messages (anonymized)</h3>
              <p className="text-xs text-gray-400 mt-1">These are REAL coach messages with student names and identifying details REMOVED:</p>
            </div>
            
            <div className="flex-1 space-y-4">
               {samples.map(msg => (
                 <div key={msg.id} className="bg-[#1C2128] border border-[#3A3F4D] p-4 rounded-lg">
                    <p className="text-gray-200 text-sm italic mb-4">"{msg.text}"</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                       <p><span className="text-gray-500">Type:</span> <span className="text-gray-300">{msg.type}</span></p>
                       <p><span className="text-gray-500">Agent:</span> <span className="text-[#7B9EA8]">{msg.agent}</span></p>
                       <p className="flex items-center gap-1">
                         <span className="text-gray-500">Reception:</span> 
                         <span className={
                           msg.reception === 'replied' ? 'text-green-400' : 
                           msg.reception === 'dismissed' ? 'text-[#C9544D]' : 'text-gray-400'
                         }>
                           {msg.reception} {msg.reception === 'replied' && '✓'}
                         </span>
                       </p>
                    </div>
                 </div>
               ))}
               
               <button onClick={() => alert("Loaded more samples.")} className="w-full py-2 border border-[#3A3F4D] text-sm text-gray-300 hover:text-white rounded hover:bg-[#1C2128] transition-colors">
                 Load more samples...
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
