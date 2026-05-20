import { useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { GoalItem } from './GoalItem';
import { Link } from 'react-router-dom';

export const GoalsList = () => {
  const goals = useDashboardStore(state => state.goals);
  const setGoals = useDashboardStore(state => state.setGoals);
  const toggleGoalDone = useDashboardStore(state => state.toggleGoalDone);
  
  useEffect(() => {
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
      .catch(e => console.error(e));
  }, [setGoals]);

  // Use only true active API goals with actual tracking logic
  const activeAPI = goals.filter(g => g.status === 'active' || g.status === 'paused');
  
  // If it's still using the mock array fallback before mounting, slice accordingly
  const isMockData = activeAPI.length === 0 && goals.length > 0 && goals[0].done !== undefined;
  const displayGoals = isMockData ? goals.filter(g => !g.done).slice(0, 3) : activeAPI.slice(0, 3);
  const activeCount = isMockData ? goals.filter(g => !g.done).length : activeAPI.length;

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[12px] font-sans font-medium text-text-primary dark:text-text-darkPri">
          {activeCount} active goals
        </h2>
        <Link to="/goals" className="text-[10px] font-sans text-accent-sage hover:text-accent-sage/80 transition-colors">
          See all
        </Link>
      </div>

      <div className="flex flex-col">
        {displayGoals.map((goal, index) => (
          <div key={goal.id}>
            <GoalItem goal={goal} onToggle={toggleGoalDone} />
            {index < displayGoals.length - 1 && (
              <div className="h-[1px] w-full bg-border-light dark:bg-border-dark" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
