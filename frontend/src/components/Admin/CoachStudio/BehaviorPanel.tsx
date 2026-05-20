import React, { useState, useEffect } from 'react';

export const BehaviorPanel: React.FC = () => {
  const [data, setData] = useState({
    max_response_sentences: 4,
    response_delay_seconds: 2,
    default_nudge_frequency: 3,
    min_gap_hours: 24,
    match_energy: true,
    soften_on_negative_mood: true,
    use_first_name: true
  });

  useEffect(() => {
    fetch('/admin/coach-studio/behavior')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  const handleSave = () => {
    fetch('/admin/coach-studio/behavior', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834]">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Behavior Settings</h2>
      </div>
      <div className="p-6 space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-white font-medium">Response Style</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max response length (sentences)</label>
              <input type="number" value={data.max_response_sentences} onChange={e => setData({...data, max_response_sentences: parseInt(e.target.value)})} className="bg-[#0D1117] border border-[#3A3F4D] rounded px-3 py-1.5 text-white w-24" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Response delay (seconds)</label>
              <input type="number" value={data.response_delay_seconds} onChange={e => setData({...data, response_delay_seconds: parseInt(e.target.value)})} className="bg-[#0D1117] border border-[#3A3F4D] rounded px-3 py-1.5 text-white w-24" />
            </div>
          </div>
        </div>

        <hr className="border-[#3A3F4D]" />

        <div className="space-y-4">
          <h3 className="text-white font-medium">Message Tone Adaptation</h3>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={data.match_energy} onChange={e => setData({...data, match_energy: e.target.checked})} className="accent-[#C9544D]" />
            <span className="text-sm text-gray-300">Match student's energy level</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={data.soften_on_negative_mood} onChange={e => setData({...data, soften_on_negative_mood: e.target.checked})} className="accent-[#C9544D]" />
            <span className="text-sm text-gray-300">Soften tone when mood is negative</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={data.use_first_name} onChange={e => setData({...data, use_first_name: e.target.checked})} className="accent-[#C9544D]" />
            <span className="text-sm text-gray-300">Use student's first name in every message</span>
          </label>
        </div>

        <button onClick={handleSave} className="bg-[#7B9EA8] text-[#0D1117] font-medium px-4 py-2 rounded-md hover:bg-[#A3BFC7] transition-colors">
          Save Behavior Settings
        </button>
      </div>
    </div>
  );
};
