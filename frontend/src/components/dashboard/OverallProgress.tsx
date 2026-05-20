import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const OverallProgress = () => {
  const [percent, setPercent] = useState(0);

  // Mock data
  const data = {
    overall_percent: 37,
    course_count_in_progress: 3,
    per_course_progress: [
      { id: '1', name: 'Python Fundamentals', progress: 65 },
      { id: '2', name: 'Data Science Basics', progress: 30 },
      { id: '3', name: 'UX Design Foundations', progress: 15 }
    ]
  };

  useEffect(() => {
    setTimeout(() => setPercent(data.overall_percent), 100);
  }, []);

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
        {data.per_course_progress.map(course => (
          <div key={course.id} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text-secondary line-clamp-1" title={course.name}>{course.name}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden">
                <div className="h-full bg-accent-sage rounded-full" style={{ width: `${course.progress}%` }} />
              </div>
              <span className="text-[11px] font-medium text-text-secondary min-w-[28px]">{course.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
