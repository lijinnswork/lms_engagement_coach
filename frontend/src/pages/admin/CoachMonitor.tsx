import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  ThumbsUp,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';

interface SampleMessage {
  id: string;
  text: string;
  type: string;
  agent: string;
  reception: 'replied' | 'dismissed' | 'ignored';
}

export const CoachMonitor: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    messages_sent: 0,
    proactive_rate: 0,
    avg_per_student_week: 0,
    positive_reception_rate: 0
  });

  const [triggerData, setTriggerData] = useState<any[]>([]);
  const [chartsData, setChartsData] = useState<any>(null);
  
  const [safety, setSafety] = useState({
    blocked_messages: 0,
    crisis_handled: 0,
    validation_failures: 0,
    total_passed: 0,
    auto_truncated: 0
  });

  const [samples, setSamples] = useState<SampleMessage[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsRes = await fetchWithAuth(`/api/admin/coach/stats?period=${period}`);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }

      const chartsRes = await fetchWithAuth(`/api/admin/coach/charts?period=${period}`);
      if (chartsRes.ok) {
        const d = await chartsRes.json();
        setChartsData(d);
        if (d.trigger_distribution && d.trigger_distribution.length > 0) {
          const colors: Record<string, string> = {
            'engagement': '#7B9EA8', 'motivation': '#E8A87C', 
            'momentum': '#B4C7B8', 'curiosity': '#D4C5B9', 'goal': '#A391E8'
          };
          const mapped = d.trigger_distribution.map((item: any) => ({
            ...item,
            itemStyle: { color: colors[item.name] || '#8A8898' }
          }));
          setTriggerData(mapped);
        } else {
          setTriggerData([]);
        }
      }

      const safetyRes = await fetchWithAuth(`/api/admin/coach/safety-report?period=${period}`);
      if (safetyRes.ok) {
        const d = await safetyRes.json();
        setSafety(d);
      }

      const samplesRes = await fetchWithAuth('/api/admin/coach/samples?count=10');
      if (samplesRes.ok) {
        const d = await samplesRes.json();
        setSamples(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

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
        data: chartsData?.message_types ?? [0, 0, 0, 0],
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
      data: chartsData?.response_rate ?? [0, 0, 0, 0, 0, 0, 0],
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
      data: triggerData.length > 0 ? triggerData : [{ value: 0, name: 'No Triggers' }]
    }]
  };

  const renderChart = (title: string, option: any, isEmpty: boolean) => {
    return (
      <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 relative">
        <h3 className="text-white font-medium mb-4">{title}</h3>
        <div className="relative">
          {isEmpty && (
            <div className="absolute inset-0 bg-[#242834]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-md z-10">
              <span className="text-sm text-gray-400 font-sans">No data yet</span>
            </div>
          )}
          <ReactECharts option={option} style={{ height: '180px' }} />
        </div>
      </div>
    );
  };

  if (!loading && stats.messages_sent === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white font-serif">Coach Monitor</h1>
        </div>
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#1C2128] flex items-center justify-center text-gray-400 mx-auto border border-[#3A3F4D]">
             <MessageSquare size={24} />
          </div>
          <h3 className="text-white font-medium text-lg font-serif">Coach Monitor</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            The coach hasn't sent any messages yet. Data will appear here once the coach begins interacting with students.
          </p>
          <p className="text-xs text-gray-500 italic">
            Make sure the Agent scheduler is running in Agent Controls.
          </p>
        </div>
      </div>
    );
  }

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
              {renderChart("Response Rate Over Time", responseRateOptions, !chartsData?.response_rate)}
              {renderChart("Trigger Distribution", triggerOptions, triggerData.length === 0)}
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
               
               {samples.length === 0 && (
                 <p className="text-sm text-gray-500 italic">No message samples available yet.</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
