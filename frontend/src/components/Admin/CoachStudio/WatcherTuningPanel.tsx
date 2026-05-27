import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../stores/authStore';

export const WatcherTuningPanel: React.FC = () => {
  const [data, setData] = useState({
    engagement: { active: true, inactivity_days: 4 },
    momentum: { active: true, consistency_streak: 7 },
    goal_progress: { active: true, behind_threshold: 50 },
    curiosity: { active: true, topic_revisit: 3 }
  });

  useEffect(() => {
    fetchWithAuth('/api/admin/coach-studio/watchers')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  const handleSave = (agent_name: string, payload: any) => {
    fetchWithAuth(`/api/admin/coach-studio/watchers/${agent_name}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const watchers = [
    { key: 'engagement', label: 'Engagement Watcher', settingKey: 'inactivity_days', settingLabel: 'Trigger after N days of inactivity' },
    { key: 'momentum', label: 'Momentum Watcher', settingKey: 'consistency_streak', settingLabel: 'Trigger after N days of consistent logins' },
    { key: 'goal_progress', label: 'Goal Progress Watcher', settingKey: 'behind_threshold', settingLabel: 'Trigger if goal progress is < N%' },
    { key: 'curiosity', label: 'Curiosity Watcher', settingKey: 'topic_revisit', settingLabel: 'Trigger after revisiting topic N times' },
  ];

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834]">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Watcher Tuning</h2>
      </div>
      <div className="p-6 space-y-6">
        {watchers.map(w => {
          const watcherData = (data as any)[w.key];
          if (!watcherData) return null;
          return (
            <div key={w.key} className="bg-[#0D1117] border border-[#3A3F4D] p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-white">{w.label}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={watcherData.active} onChange={e => {
                    const newVal = { ...watcherData, active: e.target.checked };
                    setData({...data, [w.key]: newVal});
                    handleSave(w.key, newVal);
                  }} />
                  <div className="w-9 h-5 bg-[#3A3F4D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#238636]"></div>
                </label>
              </div>
              
              <div className="flex items-center gap-4">
                 <label className="text-xs text-gray-400">{w.settingLabel}</label>
                 <input 
                   type="number" 
                   value={watcherData[w.settingKey]} 
                   onChange={e => {
                     const newVal = { ...watcherData, [w.settingKey]: parseInt(e.target.value) };
                     setData({...data, [w.key]: newVal});
                   }}
                   onBlur={() => handleSave(w.key, (data as any)[w.key])}
                   className="bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white w-16 text-sm"
                 />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
