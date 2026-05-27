import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '../../../stores/authStore';

export const LiveTestChat: React.FC = () => {
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([{sender: 'coach', text: 'Hi! Ready to test some prompts?'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptMode, setPromptMode] = useState('draft');
  const [mockStudent, setMockStudent] = useState('test');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'student', text: userMsg }]);
    setInput('');
    setLoading(true);
    setDebugInfo(null);

    try {
      const res = await fetchWithAuth('/api/admin/coach-studio/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          prompt_mode: promptMode,
          mock_student: mockStudent,
          conversation_history: messages.slice(-5)
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'coach', text: data.response }]);
      setDebugInfo(data.debug);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'system', text: 'Error connecting to test chat.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Test Controls */}
      <div className="p-4 bg-[#161B22] border-b border-[#3A3F4D] space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-400 font-medium">Prompt Version</label>
          <select value={promptMode} onChange={e => setPromptMode(e.target.value)} className="bg-[#0D1117] border border-[#3A3F4D] text-xs text-white rounded px-2 py-1">
            <option value="draft">Draft (Unsaved)</option>
            <option value="live">Live (Active)</option>
          </select>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-400 font-medium">Mock Student Persona</label>
          <select value={mockStudent} onChange={e => setMockStudent(e.target.value)} className="bg-[#0D1117] border border-[#3A3F4D] text-xs text-white rounded px-2 py-1">
            <option value="test">Test User</option>
            <option value="struggling">Struggling / Overwhelmed</option>
            <option value="active">Active / Engaged</option>
          </select>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              m.sender === 'student' 
                ? 'bg-[#C9544D] text-white rounded-br-none' 
                : m.sender === 'system'
                  ? 'bg-red-900/50 text-red-200 border border-red-500/50'
                  : 'bg-[#242834] text-gray-200 rounded-bl-none border border-[#3A3F4D]'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#242834] border border-[#3A3F4D] p-3 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader2 className="animate-spin text-[#7B9EA8]" size={16} />
              <span className="text-sm text-gray-400">Coach is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Debug Drawer */}
      {debugInfo && (
        <div className="bg-[#1C2128] border-t border-[#3A3F4D] p-3 max-h-32 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Debug Output</p>
          <pre className="text-[10px] text-gray-400 whitespace-pre-wrap font-mono">
            Time: {debugInfo.response_time_ms}ms | Match: {debugInfo.predefined_match || 'None'}
            {'\n'}Prompt: {debugInfo.prompt_sent.substring(0, 100)}...
          </pre>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[#161B22] border-t border-[#3A3F4D]">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a test message..."
            className="flex-1 bg-[#0D1117] border border-[#3A3F4D] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9544D]"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-[#C9544D] text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
