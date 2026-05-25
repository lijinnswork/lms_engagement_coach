import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalCard } from '../components/Goals/GoalCard';
import { GoalStatsBar } from '../components/Goals/GoalStatsBar';
import type { GoalStats } from '../components/Goals/GoalStatsBar';
import { CoachSuggestionsSection } from '../components/Goals/CoachSuggestionsSection';
import { CompletedGoalsSection } from '../components/Goals/CompletedGoalsSection';
import { NotificationToast } from '../components/Notifications/NotificationToast';
import { GentleButton } from '../components/Common/GentleButton';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { MobileLayout } from '../layouts/MobileLayout';
import { useDashboardStore } from '../store/dashboardStore';

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

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Modal Fields
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const breakpoint = useBreakpoint();
  
  const fetchGoals = useCallback(async () => {
    try {
      await fetch('/api/goals/')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch goals');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setGoals(data);
            useDashboardStore.getState().setGoals(data);
          }
        })
        .catch(e => console.error(e));
        
      await fetch('/api/goals/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(e => console.error(e));
    } catch (e) {
      console.error(e);
    }
  }, [setGoals, setStats]);

  useEffect(() => {
    fetchGoals();
    fetch('/api/courses')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch(e => console.error("Failed to fetch courses dropdown", e));
  }, [fetchGoals]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (status === 'active') setToastMsg("Goal approved ✓");
        if (status === 'abandoned') setToastMsg("Suggestion dismissed");
        if (status === 'completed') setToastMsg("Goal completed! 🎉");
        fetchGoals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToastMsg("Goal deleted");
        fetchGoals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setErrorMsg(null);
    
    try {
      let res;
      if (editingGoal) {
        res = await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            course_id: newCourseId || null,
            target_date: newTargetDate || null,
            description: newDescription || null,
            status: editingGoal.status === 'proposed' ? 'active' : undefined
          })
        });
      } else {
        res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             title: newTitle,
             course_id: newCourseId || null,
             target_date: newTargetDate || null,
             description: newDescription || null
          })
        });
      }
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to save goal' }));
        throw new Error(errData.detail || 'Failed to save goal');
      }
      
      setIsAdding(false);
      setEditingGoal(null);
      resetForm();
      setToastMsg(editingGoal ? "Goal updated ✓" : "Goal created ✓");
      fetchGoals();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to save goal. Please check your fields.");
    }
  };
  
  const resetForm = () => {
    setNewTitle('');
    setNewCourseId('');
    setNewTargetDate('');
    setNewDescription('');
    setErrorMsg(null);
  }
  
  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewTitle(goal.title);
    setNewCourseId(goal.course_id || '');
    setNewTargetDate(goal.target_date || '');
    setNewDescription(goal.description || '');
    setIsAdding(true);
  }

  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'paused');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const content = (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-5xl mx-auto pt-0 pb-12 px-6 w-full"
    >
      <header className="mb-10 flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-semibold text-text-primary dark:text-text-darkPri tracking-tight mb-1">My Goals</h1>
           <p className="text-[13px] text-text-secondary dark:text-text-darkSec mt-1 font-medium">Track your milestones and stay on pace.</p>
        </div>
        {!isAdding && (
          <GentleButton onClick={() => { resetForm(); setIsAdding(true); }}>
            + Add
          </GentleButton>
        )}
      </header>

      <GoalStatsBar stats={stats} />

      <CoachSuggestionsSection 
        suggestions={goals.filter(g => g.status === 'proposed' && g.proposed_by === 'coach')}
        onApprove={(id: string) => handleUpdateStatus(id, 'active')}
        onEdit={(goal: Goal) => openEditModal(goal)}
        onDismiss={(id: string) => handleUpdateStatus(id, 'abandoned')}
      />

      <div className="w-full mt-4">
        <div className="flex gap-6 border-b border-border-light dark:border-border-dark mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2 text-[15px] font-medium transition-colors relative ${activeTab === 'active' ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Active Goals ({activeGoals.length})
            {activeTab === 'active' && (
              <motion.div layoutId="goals-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-2 text-[15px] font-medium transition-colors relative ${activeTab === 'completed' ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Completed ({completedGoals.length})
            {activeTab === 'completed' && (
              <motion.div layoutId="goals-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'active' ? (
              activeGoals.length === 0 ? (
                 <div className="text-center py-8 bg-bg-secondary dark:bg-bg-darkCard rounded-xl border border-border-light dark:border-border-dark">
                   <p className="text-[14px] text-text-secondary dark:text-text-darkSec mb-4">No active goals right now. Ready to start one?</p>
                   <div className="flex justify-center">
                     <GentleButton onClick={() => { resetForm(); setIsAdding(true); }}>Create a Goal</GentleButton>
                   </div>
                 </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  <AnimatePresence mode="popLayout">
                    {activeGoals.map(goal => (
                      <motion.div key={goal.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="w-full">
                        <GoalCard 
                          goal={goal} 
                          onUpdateStatus={handleUpdateStatus}
                          onEdit={openEditModal}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            ) : (
              <CompletedGoalsSection 
                goals={completedGoals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteGoal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Create/Edit Modal Overlay */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
               onClick={() => {setIsAdding(false); setEditingGoal(null);}}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }} 
               animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} 
               exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
               className="fixed top-1/2 left-1/2 w-full max-w-lg bg-bg-primary dark:bg-bg-dark rounded-2xl p-6 md:p-8 shadow-2xl z-50 border border-border-light dark:border-border-dark max-h-[90vh] overflow-y-auto hidden-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-[22px] text-text-primary dark:text-text-darkPri">
                  {editingGoal ? (editingGoal.status === 'proposed' ? 'Suggest a change' : 'Edit Goal') : 'Create a new goal'}
                </h2>
                <button onClick={() => {setIsAdding(false); setEditingGoal(null);}} className="text-text-tertiary hover:text-text-primary">✕</button>
              </div>
              
              <form onSubmit={handleCreateOrUpdate} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[14px] text-text-secondary dark:text-text-darkSec mb-2">What would you like to achieve?</label>
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g., Finish the Python course"
                    className="w-full bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-primary"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-[14px] text-text-secondary dark:text-text-darkSec mb-2">Link to a course? (optional)</label>
                  <select 
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-text-primary dark:text-text-darkPri focus:outline-none"
                  >
                    <option value="">[None] General goal</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[14px] text-text-secondary dark:text-text-darkSec mb-2">Target date? (optional)</label>
                  <input 
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-text-primary dark:text-text-darkPri focus:outline-none"
                  />
                  <p className="text-[12px] text-text-tertiary mt-2">Leave blank or select "un-set" to go at your own pace.</p>
                </div>
                
                <div>
                  <label className="block text-[14px] text-text-secondary dark:text-text-darkSec mb-2">Add a note? (optional)</label>
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g., I want to understand recursion well enough to explain it."
                    rows={3}
                    className="w-full bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-primary resize-none"
                  />
                </div>
                
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] rounded-xl px-4 py-2 font-medium">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                  <GentleButton type="button" variant="text" onClick={() => {setIsAdding(false); setEditingGoal(null);}}>Cancel</GentleButton>
                  <GentleButton type="submit">
                     {editingGoal ? (editingGoal.status === 'proposed' ? 'Save & Approve' : 'Save changes') : 'Create Goal'}
                  </GentleButton>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <NotificationToast message={toastMsg} onClose={() => setToastMsg(null)} />
    </motion.div>
  );

  if (breakpoint === 'desktop') return <DesktopLayout>{content}</DesktopLayout>;
  if (breakpoint === 'tablet') return <TabletLayout>{content}</TabletLayout>;
  return <MobileLayout>{content}</MobileLayout>;
};
