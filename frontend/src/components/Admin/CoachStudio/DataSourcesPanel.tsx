import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../stores/authStore';

export const DataSourcesPanel: React.FC = () => {
  const [data, setData] = useState({
    lms: true,
    moods: true,
    goals: true,
    history: true,
    observations: true,
    context_window: 5
  });

  useEffect(() => {
    fetchWithAuth('/admin/coach-studio/data-sources')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  const handleSave = () => {
    fetchWithAuth('/admin/coach-studio/data-sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  const handleSync = () => {
    fetchWithAuth('/admin/coach-studio/data-sources/sync', { method: 'POST' })
      .then(() => alert('Sync triggered successfully.'));
  };

  const sources = [
    { key: 'lms', label: 'LMS Activity Data', desc: 'Course progress, logins, time spent' },
    { key: 'moods', label: 'Mood History', desc: 'Recent mood check-ins' },
    { key: 'goals', label: 'Active Goals', desc: 'Current user-set and coach-proposed goals' },
    { key: 'history', label: 'Conversation History', desc: 'Previous messages sent and received' }
  ];

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834] flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Context & Data Sources</h2>
        <button onClick={handleSync} className="text-xs text-[#7B9EA8] hover:text-white border border-[#7B9EA8]/30 px-2 py-1 rounded">Sync Now</button>
      </div>
      <div className="p-6 space-y-6">
        
        <div className="space-y-4">
          {sources.map(src => (
            <div key={src.key} className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white font-medium">{src.label}</p>
                <p className="text-xs text-gray-400">{src.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={(data as any)[src.key]} onChange={e => setData({...data, [src.key]: e.target.checked})} />
                <div className="w-9 h-5 bg-[#3A3F4D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#238636]"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#3A3F4D]">
          <label className="block text-sm font-medium text-gray-300 mb-1">Message Context Window</label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              value={data.context_window} 
              onChange={e => setData({...data, context_window: parseInt(e.target.value)})}
              className="bg-[#0D1117] border border-[#3A3F4D] rounded px-3 py-1.5 text-white w-24"
            />
            <span className="text-xs text-gray-400">Number of previous messages to include in prompt</span>
          </div>
        </div>

        <button onClick={handleSave} className="bg-[#7B9EA8] text-[#0D1117] font-medium px-4 py-2 rounded-md hover:bg-[#A3BFC7] transition-colors">
          Save Data Settings
        </button>
      </div>
    </div>
  );
};
