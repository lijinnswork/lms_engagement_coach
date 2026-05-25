
import { AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRemindersStore } from '../../store/useRemindersStore';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardStore } from '../../store/dashboardStore';

export const UpcomingDue = () => {
  const navigate = useNavigate();
  const { assessments: data } = useRemindersStore();
  const { user } = useAuthStore();
  const { setAccountOpen } = useDashboardStore();

  const isLMSConnected = !!(user?.openedx_user_id || user?.lms_username);
  const isEmpty = !data || Object.values(data).every(arr => !arr || arr.length === 0);

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

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark w-full">
      <h2 className="text-[12px] font-sans font-medium text-text-primary dark:text-text-darkPri mb-3">
        Upcoming Due
      </h2>
      
      {!isLMSConnected ? (
        <div className="text-center py-6 px-4">
          <p className="text-[14px] text-text-secondary dark:text-text-darkSec mb-3 font-sans">
            Connect to your LMS to see upcoming assignments.
          </p>
          <button 
            onClick={() => setAccountOpen(true)}
            className="text-[13px] font-medium text-accent-primary hover:underline font-sans"
          >
            Connect in Account →
          </button>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-6 px-4">
          <p className="text-[14px] text-text-secondary dark:text-text-darkSec font-sans font-medium">
            ✅ Nothing due this week — you're all clear!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.overdue && data.overdue.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-red-500 uppercase tracking-wider">Overdue</span>
              {data.overdue.map(item => renderItem(item, true))}
            </div>
          )}
          
          {data.today && data.today.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Due Today</span>
              {data.today.map(item => renderItem(item, false))}
            </div>
          )}
          
          {data.tomorrow && data.tomorrow.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Tomorrow</span>
              {data.tomorrow.map(item => renderItem(item, false))}
            </div>
          )}
          
          {data.this_week && data.this_week.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">This Week</span>
              {data.this_week.map(item => renderItem(item, false))}
            </div>
          )}
          
          <button onClick={() => navigate('/reminders')} className="text-[13px] font-medium text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 mt-2">
            View all in Reminders <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

