import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../stores/authStore';

export const BasePromptPanel: React.FC = () => {
  const [draftPrompt, setDraftPrompt] = useState('');
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    fetchWithAuth('/api/admin/coach-studio/prompt')
      .then(res => res.json())
      .then(d => {
        setDraftPrompt(d.draft_prompt || '');
      });
      
    fetchWithAuth('/api/admin/coach-studio/prompt/versions')
      .then(res => res.json())
      .then(d => setVersions(d));
  }, []);

  const saveDraft = () => {
    fetchWithAuth('/api/admin/coach-studio/prompt', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_text: draftPrompt })
    });
  };

  const publishToLive = () => {
    if(window.confirm('This will change how the coach speaks to all students. Have you tested this in the preview panel?')) {
      fetchWithAuth('/api/admin/coach-studio/prompt/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: draftPrompt })
      }).then(() => window.location.reload());
    }
  };

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834] flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Base Prompt</h2>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <textarea 
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            className="w-full h-[400px] bg-[#0D1117] border border-[#3A3F4D] rounded-md px-4 py-3 text-gray-200 font-mono text-sm focus:outline-none focus:border-[#C9544D]"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Character count: {draftPrompt.length} / 4,000</span>
            <div className="space-x-3">
              <button onClick={saveDraft} className="text-[#7B9EA8] hover:text-[#A3BFC7] text-sm font-medium">Save as Draft</button>
              <button onClick={publishToLive} className="bg-[#C9544D] text-white font-medium px-4 py-1.5 rounded-md hover:bg-red-600 transition-colors">Publish to Live</button>
            </div>
          </div>
        </div>

        {versions.length > 0 && (
          <div className="mt-8 border-t border-[#3A3F4D] pt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Version History</h3>
            <div className="space-y-3">
              {versions.map(v => (
                <div key={v.id} className="flex justify-between items-center bg-[#242834] p-3 rounded-md border border-[#3A3F4D]">
                  <div>
                    <span className="text-sm font-medium text-white mr-2">v{v.version_number}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(v.published_at).toLocaleDateString()} — "{v.prompt_text.substring(0, 40)}..."
                    </span>
                  </div>
                  {!v.is_active && (
                    <button 
                      onClick={() => { setDraftPrompt(v.prompt_text); saveDraft(); }}
                      className="text-xs text-[#7B9EA8] hover:text-white"
                    >
                      Restore to Draft
                    </button>
                  )}
                  {v.is_active && <span className="text-xs text-green-400 border border-green-400/20 px-2 py-0.5 rounded-full">Current Live</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
