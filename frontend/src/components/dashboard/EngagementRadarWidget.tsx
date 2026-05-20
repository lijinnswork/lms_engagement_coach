import React, { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useDashboardStore } from '../../store/dashboardStore';

export const EngagementRadarWidget = () => {
  const { theme } = useSettingsStore();
  const { engagementMetrics, fetchEngagementMetrics } = useDashboardStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchEngagementMetrics();
  }, [fetchEngagementMetrics]);

  const textColor = isDark ? '#A1A1AA' : '#71717A';
  const axisColor = isDark ? '#3F3F46' : '#E4E4E7';
  const primaryColor = isDark ? '#8BA3A0' : '#7B9EA8'; // sage
  const areaColor = isDark ? 'rgba(139, 163, 160, 0.2)' : 'rgba(123, 158, 168, 0.2)';

  const option = {
    radar: {
      indicator: [
        { name: 'Focus', max: 100 },
        { name: 'Consistency', max: 100 },
        { name: 'Mastery', max: 100 },
        { name: 'Curiosity', max: 100 },
        { name: 'Pacing', max: 100 }
      ],
      radius: '55%',
      center: ['50%', '50%'],
      splitNumber: 4,
      axisName: {
        color: textColor,
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      splitLine: {
        lineStyle: {
          color: [axisColor],
          opacity: 0.5
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: axisColor,
          opacity: 0.5
        }
      }
    },
    series: [
      {
        name: 'Engagement Metrics',
        type: 'radar',
        data: [
          {
            value: engagementMetrics ? [
              engagementMetrics.metrics.focus,
              engagementMetrics.metrics.consistency,
              engagementMetrics.metrics.mastery,
              engagementMetrics.metrics.curiosity,
              engagementMetrics.metrics.pacing
            ] : [0, 0, 0, 0, 0],
            name: 'Current Week',
            itemStyle: {
              color: primaryColor,
            },
            areaStyle: {
              color: areaColor,
            },
            lineStyle: {
              width: 2,
              color: primaryColor,
            },
            symbol: 'circle',
            symbolSize: 4,
          }
        ]
      }
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
      borderColor: axisColor,
      textStyle: {
        color: isDark ? '#FFFFFF' : '#18181B',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif'
      },
      padding: [8, 12],
    }
  };

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark w-full">
      <h3 className="text-[14px] font-serif text-text-primary dark:text-text-darkPri mb-1 text-center">Engagement</h3>
      <div className="h-[200px] w-full">
        {!engagementMetrics ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-accent-sage border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'svg' }}
          />
        )}
      </div>
      <div className="text-[10px] font-sans text-text-secondary dark:text-text-darkSec leading-[1.5] text-center border-t border-border-light dark:border-border-dark pt-3 mt-1 min-h-[30px]">
        {engagementMetrics?.summary || 'Loading engagement data...'}
      </div>
    </div>
  );
};
