import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Users, 
  Activity, 
  Target, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';

interface Stat {
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: React.ReactNode;
}

export const AdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [statsData, setStatsData] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await fetchWithAuth(`/api/admin/dashboard/stats?period=${period}`);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStatsData(d);
      }

      const chartsRes = await fetchWithAuth(`/api/admin/dashboard/charts?period=${period}`);
      if (chartsRes.ok) {
        const d = await chartsRes.json();
        setChartsData(d);
      }

      const feedRes = await fetchWithAuth('/api/admin/dashboard/activity-feed');
      if (feedRes.ok) {
        const d = await feedRes.json();
        setActivityFeed(d);
      }
    } catch (e) {
      console.error("Error fetching dashboard details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const stats: Stat[] = [
    { 
      label: 'Total Users', 
      value: statsData?.total_users ?? 0, 
      trend: statsData?.total_users_trend ?? 'stable', 
      trendValue: statsData?.total_users_change ?? '0', 
      icon: <Users size={18} /> 
    },
    { 
      label: 'Active This Week', 
      value: statsData?.active_this_week ?? 0, 
      trend: statsData?.active_this_week_trend ?? 'stable', 
      trendValue: statsData?.active_this_week_change ?? '0', 
      icon: <Activity size={18} /> 
    },
    { 
      label: 'Goal Completion', 
      value: statsData?.goal_completion_rate ?? '—', 
      trend: statsData?.goal_completion_trend ?? 'stable', 
      trendValue: statsData?.goal_completion_change ?? '0%', 
      icon: <Target size={18} /> 
    },
    { 
      label: 'Avg Progress', 
      value: statsData?.avg_progress ?? (statsData?.avg_mood ? `${statsData.avg_mood}/10` : '—'), 
      trend: statsData?.avg_progress_trend ?? 'stable', 
      trendValue: statsData?.avg_progress_change ?? '0', 
      icon: <Activity size={18} /> 
    },
  ];

  const hasEngagementData = chartsData && chartsData.engagement_over_time && chartsData.engagement_over_time.series && chartsData.engagement_over_time.series.length > 0;
  const hasCourseData = chartsData && chartsData.course_status && chartsData.course_status.length > 0;
  const hasGoalData = chartsData && chartsData.goal_completion && chartsData.goal_completion.completed && chartsData.goal_completion.completed.length > 0;
  const hasCoachData = chartsData && chartsData.coach_activity && chartsData.coach_activity.series && chartsData.coach_activity.series.length > 0;

  const engagementOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: hasEngagementData ? chartsData.engagement_over_time.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: '#3A3F4D' } }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { color: '#1C2128' } }
    },
    series: [{
      data: hasEngagementData ? chartsData.engagement_over_time.series : [0, 0, 0, 0, 0, 0, 0],
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
      data: hasCourseData ? chartsData.course_status : [
        { value: 0, name: 'Active', itemStyle: { color: '#B4C7B8' } },
        { value: 0, name: 'Completed', itemStyle: { color: '#7B9EA8' } },
        { value: 0, name: 'Inactive', itemStyle: { color: '#D4C5B9' } },
        { value: 0, name: 'At Risk', itemStyle: { color: '#C9544D' } }
      ]
    }]
  };

  const goalOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: '#8A8898' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: hasGoalData ? chartsData.goal_completion.labels : ['W1', 'W2', 'W3', 'W4'], 
      axisLine: { lineStyle: { color: '#3A3F4D' } } 
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1C2128' }} },
    series: [
      { 
        name: 'Completed', 
        type: 'bar', 
        stack: 'total', 
        itemStyle: { color: '#B4C7B8' }, 
        data: hasGoalData ? chartsData.goal_completion.completed : [0, 0, 0, 0] 
      },
      { 
        name: 'Active', 
        type: 'bar', 
        stack: 'total', 
        itemStyle: { color: '#7B9EA8' }, 
        data: hasGoalData ? chartsData.goal_completion.active : [0, 0, 0, 0] 
      },
      { 
        name: 'Abandoned', 
        type: 'bar', 
        stack: 'total', 
        itemStyle: { color: '#3A3F4D' }, 
        data: hasGoalData ? chartsData.goal_completion.abandoned : [0, 0, 0, 0] 
      }
    ],
    textStyle: { color: '#8A8898' }
  };

  const coachActivityOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: hasCoachData ? chartsData.coach_activity.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: '#3A3F4D' } }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { color: '#1C2128' } }
    },
    series: [{
      data: hasCoachData ? chartsData.coach_activity.series : [0, 0, 0, 0, 0, 0, 0],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#B4C7B8', width: 3 },
      itemStyle: { color: '#B4C7B8' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#B4C7B855' }, { offset: 1, color: '#B4C7B800' }]
        }
      }
    }],
    textStyle: { color: '#8A8898' }
  };

  const renderChart = (title: string, option: any, isEmpty: boolean) => {
    return (
      <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 relative">
        <h3 className="text-white font-medium mb-4">{title}</h3>
        <div className="relative">
          {isEmpty && (
            <div className="absolute inset-0 bg-[#242834]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-md z-10">
              <span className="text-sm text-gray-400 font-sans">No data yet</span>
              <span className="text-[10px] text-gray-500 mt-1 font-sans">Charts will populate as students enroll and use the platform</span>
            </div>
          )}
          <ReactECharts option={option} style={{ height: '300px' }} />
        </div>
      </div>
    );
  };

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
        {renderChart("Engagement Over Time", engagementOptions, !hasEngagementData)}
        {renderChart("Course Status Distribution", courseOptions, !hasCourseData)}
        {renderChart("Goal Completion Rate", goalOptions, !hasGoalData)}
        {renderChart("Coach Activity", coachActivityOptions, !hasCoachData)}
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
              <p className="text-white text-2xl font-mono mb-2">{statsData?.inactive_count ?? 0} students inactive</p>
              <p className="text-xs text-gray-400">↑ {statsData?.inactive_change ?? 0} more than last week (aggregate only)</p>
            </div>
            
            <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">Course Progress</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                 {statsData?.course_progress && statsData.course_progress.length > 0 ? (
                   statsData.course_progress.map((course: any, idx: number) => (
                     <div key={idx} className="space-y-1.5 pb-3 border-b border-[#3A3F4D]/40 last:border-0 last:pb-0">
                       <div className="flex justify-between text-xs">
                         <span className="text-gray-300 truncate max-w-[70%] font-sans font-medium">{course.course_name}</span>
                         <span className="text-gray-400 font-mono">{course.avg_progress_percent}% avg</span>
                       </div>
                       <div className="w-full bg-[#1C2128] rounded-full h-2">
                         <div 
                           className="bg-[#B4C7B8] h-2 rounded-full transition-all duration-500" 
                           style={{ width: `${course.avg_progress_percent}%` }}
                         />
                       </div>
                       <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-400 pt-0.5 font-sans">
                         <span className="flex items-center gap-0.5">
                           <span className="text-gray-500">👥</span> {course.total_enrolled_learners} enrolled
                         </span>
                         <span className="text-gray-600">·</span>
                         <span className="flex items-center gap-0.5">
                           <span className="text-gray-500">📈</span> Grade: {course.avg_grade_percent}%
                         </span>
                         <span className="text-gray-600">·</span>
                         <span className="flex items-center gap-0.5">
                           <span className="text-gray-500">📝</span> Graded: {course.graded_learners_count}
                         </span>
                       </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-gray-500 italic py-4 text-center">No progress data cached yet.</p>
                 )}
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
               {activityFeed.length === 0 && (
                 <p className="text-sm text-gray-500 italic mt-2 font-sans">No activity recorded yet. Data will appear as students use the platform.</p>
               )}
            </div>
         </div>
      </div>
      
    </div>
  );
};
