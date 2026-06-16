import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '../../stores/authStore';

export const OverallProgress = () => {
  const [data, setData] = useState<any>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    fetchWithAuth('/api/courses/overall-progress')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch overall progress");
      })
      .then(json => {
        setData(json);
        setTimeout(() => setPercent(json.overall_percent || 0), 100);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  if (!data) {
    return (
      <div className="w-full mb-8 flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-accent-sage border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-[14px] text-text-secondary font-medium uppercase tracking-wider">Overall Progress</h3>
        <span className="text-[14px] font-bold text-text-primary dark:text-text-darkPri">{data.overall_percent}% complete</span>
      </div>
      
      <div className="w-full h-3 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden mb-4">
        <motion.div 
          className="h-full bg-gradient-to-r from-accent-sage to-[#8FB0B9] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {(data.per_course_progress || []).map((course: any) => {
          const progress = course.progress_percent ?? course.progress ?? 0;
          return (
            <div key={course.course_id || course.id} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-secondary line-clamp-1" title={course.course_name || course.name}>{course.course_name || course.name}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden">
                  <div className="h-full bg-accent-sage rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[11px] font-medium text-text-secondary min-w-[28px]">{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
