import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Users, 
  Activity, 
  Target, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: React.ReactNode;
}

export const AdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  
  // Simulated data for demo (ordinarily from /api/admin/dashboard/stats)
  const stats: Stat[] = [
    { label: 'Total Users', value: 247, trend: 'up', trendValue: '12', icon: <Users size={18} /> },
    { label: 'Active This Week', value: 189, trend: 'down', trendValue: '5', icon: <Activity size={18} /> },
    { label: 'Goal Completion', value: '72%', trend: 'up', trendValue: '4%', icon: <Target size={18} /> },
    { label: 'Avg Engagement Score', value: '8.4/10', trend: 'up', trendValue: '+0.2', icon: <Activity size={18} /> },
  ];

  const engagementOptions = {
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
      data: [120, 132, 101, 134, 190, 230, 210],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#7B9EA8', width: 3 },
      itemStyle: { color: '#7B9EA8' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#7B9EA855' }, { offset: 1, color: '#7B9EA800' }]
        }
      }
    }],
    textStyle: { color: '#8A8898' }
  };

  const courseOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{
      name: 'Status',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#242834', borderWidth: 2 },
      label: { show: false, position: 'center' },
      data: [
        { value: 1048, name: 'Active', itemStyle: { color: '#B4C7B8' } },
        { value: 735, name: 'Completed', itemStyle: { color: '#7B9EA8' } },
        { value: 580, name: 'Inactive', itemStyle: { color: '#D4C5B9' } },
        { value: 300, name: 'At Risk', itemStyle: { color: '#C9544D' } }
      ]
    }]
  };

  const goalOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: '#8A8898' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['W1', 'W2', 'W3', 'W4'], axisLine: { lineStyle: { color: '#3A3F4D' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1C2128' }} },
    series: [
      { name: 'Completed', type: 'bar', stack: 'total', itemStyle: { color: '#B4C7B8' }, data: [120, 132, 101, 134] },
      { name: 'Active', type: 'bar', stack: 'total', itemStyle: { color: '#7B9EA8' }, data: [220, 182, 191, 234] },
      { name: 'Abandoned', type: 'bar', stack: 'total', itemStyle: { color: '#3A3F4D' }, data: [150, 232, 201, 154] }
    ],
    textStyle: { color: '#8A8898' }
  };

  const activityFeed = [
    "14 students completed a module today",
    "15 course progress updates in the last hour",
    "Coach sent 12 proactive messages today",
    "10 students completed a course today",
    "3 new goals created today"
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white font-serif">Dashboard Overview</h1>
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
             <option value="90d">Last 90 days</option>
             <option value="all">All time</option>
           </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
              <div className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-gray-300">
                {stat.icon}
              </div>
            </div>
            
            <div className="flex items-end gap-3">
              <span className="text-3xl font-mono text-white tracking-tight">{stat.value}</span>
              
              <div className={`flex items-center gap-1 text-xs mb-1 font-medium px-2 py-0.5 rounded-full ${
                stat.trend === 'up' ? 'text-green-400 bg-green-400/10' :
                stat.trend === 'down' ? 'text-amber-400 bg-amber-400/10' :
                'text-gray-400 bg-gray-400/10'
              }`}>
                {stat.trend === 'up' && <TrendingUp size={12} />}
                {stat.trend === 'down' && <TrendingDown size={12} />}
                {stat.trend === 'stable' && <Minus size={12} />}
                <span>{stat.trendValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Engagement Over Time</h3>
            <ReactECharts option={engagementOptions} style={{ height: '300px' }} />
         </div>
         <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Course Status Distribution</h3>
            <ReactECharts option={courseOptions} style={{ height: '300px' }} />
         </div>
         <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Goal Completion Rate</h3>
            <ReactECharts option={goalOptions} style={{ height: '300px' }} />
         </div>
         <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Coach Activity</h3>
            <ReactECharts option={engagementOptions} style={{ height: '300px' }} />
         </div>
      </div>

      {/* Alerts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Alerts column */}
         <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#C9544D]/10 border border-[#C9544D]/30 rounded-xl p-5">
              <h3 className="text-[#C9544D] font-medium mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-[#C9544D]"></span>
                 Engagement Alerts
              </h3>
              <p className="text-white text-2xl font-mono mb-2">12 students inactive</p>
              <p className="text-xs text-gray-400">↑ 2 more than last week (aggregate only)</p>
            </div>
            
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">Course Progress</h3>
              <div className="space-y-3 relative">
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
                   <span className="text-sm text-gray-300 bg-[#1C2128] px-3 py-1 rounded-full border border-[#3A3F4D]">LMS Sync Pending</span>
                 </div>
                 {/* Fake bars behind overlay */}
                 <div className="w-full bg-[#1C2128] rounded-full h-3"><div className="bg-[#B4C7B8] h-3 rounded-full w-[45%]"></div></div>
                 <div className="w-full bg-[#1C2128] rounded-full h-3"><div className="bg-[#B4C7B8] h-3 rounded-full w-[60%]"></div></div>
              </div>
            </div>
         </div>

         {/* Activity feed column */}
         <div className="lg:col-span-2 bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 h-full flex flex-col">
            <h3 className="text-white font-medium mb-4">Recent Activity Feed</h3>
            <div className="flex-1 space-y-4">
               {activityFeed.map((feed, idx) => (
                 <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#7B9EA8] shrink-0"></div>
                    <p className="text-gray-300 text-sm leading-relaxed">{feed}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>
      
    </div>
  );
};
