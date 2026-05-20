import React, { useState } from 'react';
import { SoftCard } from '../Common/SoftCard';
import { GentleButton } from '../Common/GentleButton';
import { MoreVertical, Check, Pause, Edit2, Trash2, BookOpen, Target, CheckCircle2 } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description?: string;
  course_id?: string;
  target_date?: string;
  status: "proposed" | "active" | "completed" | "paused" | "abandoned";
  proposed_by: "student" | "coach";
  progress_percent: number;
  created_at: string;
  approved_at?: string;
}

interface GoalCardProps {
  goal: Goal;
  onApprove?: (id: string) => void;
  onSuggestChange?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onEdit?: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onApprove, onSuggestChange, onUpdateStatus, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isProposed = goal.status === 'proposed';
  const isCourseSpecific = !!goal.course_id;
  
  // Progress pace logic
  let paceStatus = '';
  let paceColor = '';
  
  if (goal.status === 'active' && goal.target_date) {
    const start = new Date(goal.approved_at || goal.created_at);
    const target = new Date(goal.target_date);
    const now = new Date();
    
    start.setHours(0,0,0,0);
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const totalDays = Math.max((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
    const elapsedDays = Math.max((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
    const expectedProgress = Math.min((elapsedDays / totalDays) * 100, 100);
    
    if (goal.progress_percent >= expectedProgress * 0.8 || expectedProgress === 0) {
      paceStatus = "On track ✓";
      paceColor = "text-accent-soft";
    } else if (goal.progress_percent >= expectedProgress * 0.5) {
      paceStatus = "A bit behind";
      paceColor = "text-accent-warm";
    } else {
      paceStatus = "Needs attention";
      paceColor = "text-[#D4856A]"; 
    }
  } else if (goal.status === 'active') {
    paceStatus = "No deadline — going at your own pace";
    paceColor = "text-text-secondary dark:text-text-darkSec";
  }

  // Formatting date
  const targetDateStr = goal.target_date 
    ? new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  // Left Border Logic
  let borderClass = 'border-l-[4px] ';
  if (isProposed) borderClass += 'border-l-accent-warm';
  else if (goal.status === 'active') borderClass += 'border-l-accent-sage';
  else if (goal.status === 'completed') borderClass += 'border-l-accent-soft';
  else borderClass += 'border-l-border-light dark:border-l-border-dark';

  return (
    <SoftCard className={`w-full relative ${borderClass} overflow-visible transition-colors`}>
      {goal.status === 'completed' ? (
        // COMPLETED STATE
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-accent-sage" />
            <div>
              <h3 className="font-sans font-bold text-text-primary dark:text-text-darkPri">{goal.title}</h3>
              <p className="text-[13px] text-text-secondary dark:text-text-darkSec">
                {isCourseSpecific ? 'Course Goal' : 'General Goal'} · Done recently
              </p>
            </div>
          </div>
          <button onClick={() => onUpdateStatus?.(goal.id, 'active')} className="text-xs text-text-secondary px-2 hover:text-text-primary">
            Undo
          </button>
        </div>
      ) : (
        // ACTIVE & PROPOSED STATES
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2 items-start text-text-secondary">
              {!isProposed && (
                isCourseSpecific 
                  ? <BookOpen size={20} className="mt-0.5 text-accent-sage" />
                  : <Target size={20} className="mt-0.5 text-accent-soft" />
              )}
              <div>
                <h3 className="font-sans font-bold text-[16px] text-text-primary dark:text-text-darkPri leading-tight">{goal.title}</h3>
                <p className="text-[13px] text-text-secondary dark:text-text-darkSec mt-0.5">
                  {isCourseSpecific ? 'Course Goal' : 'General Goal'}
                </p>
              </div>
            </div>
            
            {/* Context Menu for Active Goals */}
            {!isProposed && (
              <div className="relative">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 text-text-tertiary hover:text-text-primary rounded"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark shadow-xl rounded-lg py-1 z-20">
                      <button 
                        onClick={() => { setMenuOpen(false); onUpdateStatus?.(goal.id, 'paused'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-secondary dark:hover:bg-bg-darkCard flex items-center gap-2 text-text-primary dark:text-text-darkPri"
                      >
                        <Pause size={14} /> Pause goal
                      </button>
                      <button 
                        onClick={() => { setMenuOpen(false); onEdit?.(goal); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-secondary dark:hover:bg-bg-darkCard flex items-center gap-2 text-text-primary dark:text-text-darkPri"
                      >
                        <Edit2 size={14} /> Edit goal
                      </button>
                      <button 
                        onClick={() => { setMenuOpen(false); onUpdateStatus?.(goal.id, 'completed'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-secondary dark:hover:bg-bg-darkCard flex items-center gap-2 text-accent-sage"
                      >
                        <Check size={14} /> Mark as complete
                      </button>
                      <div className="h-[1px] bg-border-light dark:bg-border-dark my-1" />
                      <button 
                        onClick={() => { setMenuOpen(false); onUpdateStatus?.(goal.id, 'abandoned'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-secondary dark:hover:bg-bg-darkCard flex items-center gap-2 text-[#D4856A]"
                      >
                        <Trash2 size={14} /> Abandon goal
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Coach Proposal Context */}
          {isProposed && (
            <div className="mt-2 mb-4">
               <p className="text-[12px] text-text-secondary dark:text-text-darkSec mb-1">
                 Proposed by your coach
               </p>
               {goal.description && (
                  <p className="text-[14px] text-text-secondary dark:text-text-darkSec font-serif italic border-l-2 border-border-light dark:border-border-dark pl-3">
                    "{goal.description}"
                  </p>
               )}
            </div>
          )}

          {/* Progress Bar for Active Goals */}
          {!isProposed && (
            <div className="mt-3">
              <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-[6px] mb-2 overflow-hidden flex">
                 <div 
                   className="bg-accent-sage h-full rounded-full transition-all duration-500 ease-out" 
                   style={{ width: `${goal.progress_percent}%` }}
                 />
                 {/* Grey hash fill conceptually replacing the ░ blocks */}
              </div>
              <div className="flex justify-between items-center text-[12px]">
                 <span className="text-text-secondary dark:text-text-darkSec font-medium">
                   {goal.progress_percent}%
                 </span>
                 <span className={`${paceColor} font-medium`}>
                   {goal.target_date ? `Target: ${targetDateStr} · ${paceStatus}` : paceStatus}
                 </span>
              </div>
            </div>
          )}

          {/* Proposal Action Buttons */}
          {isProposed && (
            <div className="flex gap-2 mt-4">
              <GentleButton onClick={() => onApprove?.(goal.id)}>
                <Check size={14} className="inline mr-1" /> Approve
              </GentleButton>
              <GentleButton variant="text" onClick={() => onSuggestChange?.(goal.id)}>
                <Edit2 size={14} className="inline mr-1" /> Suggest a change
              </GentleButton>
            </div>
          )}
          
          {/* Metadata for active */}
          {!isProposed && goal.status === 'active' && goal.proposed_by === 'coach' && (
             <p className="text-[11px] text-text-tertiary mt-4">
               Suggested by: your coach
             </p>
          )}

        </div>
      )}
    </SoftCard>
  );
};
