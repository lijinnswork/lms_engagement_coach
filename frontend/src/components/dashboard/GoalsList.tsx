import { useEffect, useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { GoalItem } from './GoalItem';
import { Link } from 'react-router-dom';

export const GoalsList = () => {
  const goals = useDashboardStore(state => state.goals);
  const setGoals = useDashboardStore(state => state.setGoals);
  const toggleGoalDone = useDashboardStore(state => state.toggleGoalDone);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/goals/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch goals');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setGoals(data);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [setGoals]);

  // Use only true active and proposed API goals
  const displayGoals = goals
    .filter(g => g.status === 'active' || g.status === 'proposed')
    .slice(0, 3);
    
  const activeCount = goals.filter(g => g.status === 'active').length;
  const hasProposed = goals.some(g => g.status === 'proposed');

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[12px] font-sans font-medium text-text-primary dark:text-text-darkPri">
          Goals this week
        </h2>
        {goals.length > 0 && (
          <Link to="/goals" className="text-[10px] font-sans text-accent-sage hover:text-accent-sage/80 transition-colors">
            See all
          </Link>
        )}
      </div>

      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-5 h-5 border-2 border-accent-sage border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-[14px] text-text-secondary dark:text-text-darkSec mb-2 font-sans">
              No goals set yet.
            </p>
            <Link 
              to="/goals" 
              className="text-[13px] font-medium text-accent-primary hover:underline"
            >
              + Create your first goal →
            </Link>
          </div>
        ) : (
          displayGoals.map((goal, index) => (
            <div key={goal.id}>
              <GoalItem goal={goal} onToggle={toggleGoalDone} />
              {index < displayGoals.length - 1 && (
                <div className="h-[1px] w-full bg-border-light dark:bg-border-dark" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
