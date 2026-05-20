import React, { useState, useEffect } from 'react';

export const PersonaPanel: React.FC = () => {
  const [data, setData] = useState({
    display_name: 'Your Coach',
    avatar_url: '',
    personality_description: 'A supportive friend who is warm, casual, and empathetic.',
    personality_traits: ['Warm', 'Casual', 'Empathetic', 'Curious']
  });

  const allTraits = ['Warm', 'Casual', 'Empathetic', 'Curious', 'Formal', 'Motivational', 'Direct', 'Humorous'];

  useEffect(() => {
    fetch('/admin/coach-studio/persona')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error);
  }, []);

  const handleSave = () => {
    fetch('/admin/coach-studio/persona', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  const toggleTrait = (trait: string) => {
    setData(prev => {
      const traits = prev.personality_traits.includes(trait)
        ? prev.personality_traits.filter(t => t !== trait)
        : [...prev.personality_traits, trait];
      return { ...prev, personality_traits: traits };
    });
  };

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834]">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Persona</h2>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
          <input 
            type="text" 
            value={data.display_name} 
            onChange={(e) => setData({...data, display_name: e.target.value})}
            className="w-full bg-[#0D1117] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#C9544D]"
          />
          <p className="text-xs text-gray-500 mt-1">This is what students see. Leave as "Your Coach" for a neutral feel.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Personality Description</label>
          <textarea 
            value={data.personality_description}
            onChange={(e) => setData({...data, personality_description: e.target.value})}
            className="w-full h-24 bg-[#0D1117] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#C9544D]"
          />
          <p className="text-xs text-gray-500 mt-1">This description helps YOU remember the coach's character. It is NOT sent to the AI.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Personality Traits (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {allTraits.map(trait => (
              <button
                key={trait}
                onClick={() => toggleTrait(trait)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  data.personality_traits.includes(trait)
                    ? 'bg-[#C9544D]/20 text-[#C9544D] border-[#C9544D]/40'
                    : 'bg-[#0D1117] text-gray-400 border-[#3A3F4D] hover:bg-[#242834]'
                }`}
              >
                {data.personality_traits.includes(trait) ? '✓ ' : ''}{trait}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="bg-[#7B9EA8] text-[#0D1117] font-medium px-4 py-2 rounded-md hover:bg-[#A3BFC7] transition-colors">
          Save Persona
        </button>
      </div>
    </div>
  );
};
