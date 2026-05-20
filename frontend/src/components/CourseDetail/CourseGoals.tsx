import React, { useEffect, useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CourseGoals = ({ courseId, data }: { courseId: string, data: any }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/goals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const allGoals = await res.json();
          const courseGoals = allGoals.filter((g: any) => g.course_id === courseId);
          setGoals(courseGoals);
        }
      } catch (err) {
        console.error("Failed to fetch goals", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchGoals();
    }
  }, [courseId]);

  const handleSetGoal = () => {
    // Navigate to goals page to set a goal. We could use state to prefill if supported.
    navigate('/goals');
  };

  const getStatusText = (goal: any) => {
    if (goal.status === 'completed') return <span className="text-accent-soft">Completed ✅</span>;
    // Basic logic for on track (assume on track for mock)
    return <span className="text-accent-soft">On track ✓</span>;
  };

  if (loading) return null;

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 text-text-primary dark:text-text-darkPri">
        <Target size={18} />
        <h2 className="font-serif text-[16px] font-medium">Your Goals for This Course</h2>
      </div>

      {goals.length > 0 ? (
        <div className="flex flex-col gap-3">
          {goals.map((goal, idx) => (
            <div key={idx} className="border border-border-light dark:border-border-dark rounded-xl p-4 flex flex-col gap-2">
              <h3 className="text-[14px] font-medium text-text-primary dark:text-text-darkPri">{goal.title}</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden">
                  <div className="h-full bg-accent-primary rounded-full" style={{ width: `${data.progress_percent || 0}%` }}></div>
                </div>
                <div className="text-[12px] text-text-secondary flex items-center gap-2">
                  <span className="font-mono">{Math.round(data.progress_percent || 0)}%</span>
                  <span>·</span>
                  {getStatusText(goal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[14px] text-text-secondary">
          No goals set for this course yet. Setting a goal can help you stay focused.
        </div>
      )}

      <button 
        onClick={handleSetGoal}
        className="text-[14px] font-medium text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1 mt-2 w-max"
      >
        <Plus size={16} />
        Set a goal for this course
      </button>
    </div>
  );
};
