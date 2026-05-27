import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { fetchWithAuth } from '../../../stores/authStore';

export const PredefinedResponsesPanel: React.FC = () => {
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    fetchWithAuth('/api/admin/coach-studio/responses')
      .then(res => res.json())
      .then(d => setResponses(d));
  }, []);

  const addRow = () => {
    setResponses([...responses, { isNew: true, trigger_name: '', trigger_keywords: [], match_mode: 'any', priority: 'normal', response_text: '' }]);
  };

  const saveRow = (index: number) => {
    const row = responses[index];
    const url = row.id ? `/api/admin/coach-studio/responses/${row.id}` : '/api/admin/coach-studio/responses';
    const method = row.id ? 'PATCH' : 'POST';
    
    fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    }).then(() => window.location.reload());
  };

  const deleteRow = (id: string, index: number) => {
    if(!id) {
      setResponses(responses.filter((_, i) => i !== index));
      return;
    }
    fetchWithAuth(`/api/admin/coach-studio/responses/${id}`, { method: 'DELETE' })
      .then(() => window.location.reload());
  };

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834] flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Predefined Responses</h2>
          <p className="text-xs text-gray-500 mt-1">Force the coach to respond a certain way for specific keywords.</p>
        </div>
        <button onClick={addRow} className="flex items-center gap-1 text-[#7B9EA8] hover:text-white text-sm"><Plus size={16}/> Add Rule</button>
      </div>
      <div className="p-6 space-y-4">
        {responses.length === 0 && <p className="text-gray-500 text-sm">No predefined responses set.</p>}
        {responses.map((r, i) => (
          <div key={r.id || i} className="bg-[#0D1117] border border-[#3A3F4D] p-4 rounded-md space-y-4 relative">
            <div className="grid grid-cols-2 gap-4 pr-8">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Trigger Name</label>
                <input type="text" value={r.trigger_name} onChange={e => {
                  const newR = [...responses]; newR[i].trigger_name = e.target.value; setResponses(newR);
                }} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-sm" placeholder="e.g. Content Explanation" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Keywords (comma separated)</label>
                <input type="text" value={r.trigger_keywords?.join(', ')} onChange={e => {
                  const newR = [...responses]; newR[i].trigger_keywords = e.target.value.split(',').map(s=>s.trim()); setResponses(newR);
                }} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-sm" placeholder="e.g. explain, how does, teach me" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                <select value={r.priority} onChange={e => {
                  const newR = [...responses]; newR[i].priority = e.target.value; setResponses(newR);
                }} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-sm">
                  <option value="normal">Normal (Suggest to AI)</option>
                  <option value="strict">Strict (Bypass AI)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Match Mode</label>
                <select value={r.match_mode} onChange={e => {
                  const newR = [...responses]; newR[i].match_mode = e.target.value; setResponses(newR);
                }} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-sm">
                  <option value="any">Any Keyword</option>
                  <option value="all">All Keywords</option>
                  <option value="exact">Exact Phrase</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Response Text</label>
              <textarea value={r.response_text} onChange={e => {
                  const newR = [...responses]; newR[i].response_text = e.target.value; setResponses(newR);
                }} className="w-full h-16 bg-[#1C2128] border border-[#3A3F4D] rounded px-2 py-1 text-white text-sm" />
            </div>
            <div className="flex justify-between items-center pt-2">
               <button onClick={() => saveRow(i)} className="bg-[#3A3F4D] text-white px-3 py-1 text-xs rounded hover:bg-gray-600">Save Rule</button>
               <button onClick={() => deleteRow(r.id, i)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
