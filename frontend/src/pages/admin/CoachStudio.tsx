import React, { useState } from 'react';
import { PersonaPanel } from '../../components/Admin/CoachStudio/PersonaPanel';
import { BasePromptPanel } from '../../components/Admin/CoachStudio/BasePromptPanel';
import { BehaviorPanel } from '../../components/Admin/CoachStudio/BehaviorPanel';
import { DataSourcesPanel } from '../../components/Admin/CoachStudio/DataSourcesPanel';
import { PredefinedResponsesPanel } from '../../components/Admin/CoachStudio/PredefinedResponsesPanel';
import { KnowledgeBasePanel } from '../../components/Admin/CoachStudio/KnowledgeBasePanel';
import { WatcherTuningPanel } from '../../components/Admin/CoachStudio/WatcherTuningPanel';
import { LiveTestChat } from '../../components/Admin/CoachStudio/LiveTestChat';
import { Sliders } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export const CoachStudio: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const [showTestChat, setShowTestChat] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen">
      {/* Header */}
      <div className="p-6 border-b border-[#1C2128] flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-200 font-serif flex items-center gap-3">
          <Sliders className="text-[#C9544D]" size={24} />
          AI Coach Studio
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Fine-tune the coach's personality, behavior, and data sources.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row relative">
        {/* Left: Configuration Panels */}
        <div className="w-full lg:w-[60%] h-full overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-[#3A3F4D] scrollbar-track-transparent">
          <PersonaPanel />
          <BasePromptPanel />
          <BehaviorPanel />
          {/* Data & Integrations */}
          <DataSourcesPanel />

          {/* Knowledge Base */}
          <KnowledgeBasePanel />

          {/* Predefined Rules */}
          <PredefinedResponsesPanel />
          <WatcherTuningPanel />
          <div className="h-20 lg:hidden"></div> {/* Spacer for mobile button */}
        </div>

        {/* Right: Live Test Chat */}
        {(!isMobile || showTestChat) && (
          <div className={`
            ${isMobile ? 'fixed inset-0 z-50 bg-[#0D1117]' : 'w-[40%] border-l border-[#1C2128]'}
            h-full flex flex-col bg-[#0D1117]
          `}>
            {isMobile && (
              <div className="p-4 border-b border-[#1C2128] flex justify-between items-center bg-[#161B22]">
                <h2 className="text-lg font-medium text-white">Live Test Chat</h2>
                <button onClick={() => setShowTestChat(false)} className="text-gray-400 hover:text-white">
                  Close
                </button>
              </div>
            )}
            <LiveTestChat />
          </div>
        )}

        {/* Mobile floating button */}
        {isMobile && !showTestChat && (
          <button
            onClick={() => setShowTestChat(true)}
            className="fixed bottom-6 right-6 bg-[#C9544D] text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 z-40"
          >
            <Sliders size={18} />
            Test Coach
          </button>
        )}
      </div>
    </div>
  );
};
