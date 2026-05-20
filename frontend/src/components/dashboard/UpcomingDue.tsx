
import { AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useRemindersStore } from '../../store/useRemindersStore';

export const UpcomingDue = () => {
  const navigate = useNavigate();
  
  // Use data from the store
  const { assessments: data } = useRemindersStore();

  const renderItem = (item: any, isOverdue: boolean) => (
    <div key={item.id} className={`p-3 rounded-xl border ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-bg-primary dark:bg-bg-dark border-border-light dark:border-border-dark'} cursor-pointer hover:shadow-sm transition-shadow`} onClick={() => window.open('#', '_blank')}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {isOverdue ? <AlertCircle size={14} className="text-red-500" /> : <FileText size={14} className="text-text-secondary" />}
          <span className={`text-[14px] font-bold ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-text-primary dark:text-text-darkPri'}`}>{item.name}</span>
        </div>
        <span className={`text-[12px] whitespace-nowrap ml-2 ${isOverdue ? 'text-red-600 dark:text-red-500' : 'text-text-secondary'}`}>
          {item.status}
        </span>
      </div>
      <div className="text-[12px] text-text-secondary ml-6">{item.course_name}</div>
    </div>
  );

  const isEmpty = Object.values(data).every(arr => arr.length === 0);

  return (
    <div className="flex flex-col gap-4">
      {isEmpty ? (
        <div className="text-center p-6 bg-accent-sage/10 rounded-xl text-accent-sage font-medium">
          ✅ Nothing due this week — you're all clear!
        </div>
      ) : (
        <>
          {data.overdue.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-red-500 uppercase tracking-wider">Overdue</span>
              {data.overdue.map(item => renderItem(item, true))}
            </div>
          )}
          
          {data.today.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Due Today</span>
              {data.today.map(item => renderItem(item, false))}
            </div>
          )}
          
          {data.tomorrow.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Tomorrow</span>
              {data.tomorrow.map(item => renderItem(item, false))}
            </div>
          )}
          
          {data.this_week.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">This Week</span>
              {data.this_week.map(item => renderItem(item, false))}
            </div>
          )}
        </>
      )}
      
      <button onClick={() => navigate('/reminders')} className="text-[13px] font-medium text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 mt-2">
        View all in Reminders <ArrowRight size={14} />
      </button>
    </div>
  );
};
