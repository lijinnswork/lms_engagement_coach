import React from 'react';
import { Trophy, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export const MilestonesList = ({ data }: { data: any }) => {
  const itemsCompleted = data.items_completed || 0;
  const totalItems = data.total_items || 1;
  const overallGrade = data.overall_grade || 0;
  const passFail = data.pass_fail_status || 'unknown';
  const assessments = data.assessments || [];
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getFirstAssessmentPassDate = () => {
    const passed = assessments.filter((a: any) => a.score >= 60).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return passed.length > 0 ? passed[0].timestamp : null;
  };
  
  const milestones = [
    {
      id: 'first_item',
      title: 'First item completed',
      achieved: itemsCompleted >= 1,
      date: itemsCompleted >= 1 ? data.last_activity_time : null // proxy date
    },
    {
      id: 'halfway',
      title: `Halfway reached (${Math.floor(totalItems/2)} of ${totalItems})`,
      achieved: itemsCompleted >= totalItems / 2,
      date: itemsCompleted >= totalItems / 2 ? data.last_activity_time : null
    },
    {
      id: 'first_assessment',
      title: 'First assessment passed',
      achieved: getFirstAssessmentPassDate() !== null,
      date: getFirstAssessmentPassDate()
    },
    {
      id: 'grade_80',
      title: 'Grade above 80%',
      achieved: overallGrade >= 80,
      date: overallGrade >= 80 ? data.grade_last_updated : null
    },
    {
      id: 'all_items',
      title: 'All items completed',
      achieved: itemsCompleted === totalItems && totalItems > 0,
      date: itemsCompleted === totalItems ? data.last_activity_time : null
    },
    {
      id: 'course_passed',
      title: 'Course passed',
      achieved: passFail === 'pass',
      date: passFail === 'pass' ? data.grade_last_updated : null
    }
  ];

  const achieved = milestones.filter(m => m.achieved);
  const unachieved = milestones.filter(m => !m.achieved);
  
  const sortedMilestones = [...achieved, ...unachieved];

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2 text-text-primary dark:text-text-darkPri">
        <Trophy size={18} />
        <h2 className="font-serif text-[16px] font-medium">Milestones</h2>
      </div>

      <div className="flex flex-col gap-4">
        {sortedMilestones.map((m, idx) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {m.achieved ? (
                <CheckCircle2 size={18} className="text-accent-soft shrink-0" />
              ) : (
                <Circle size={18} className="text-border-light dark:text-border-dark shrink-0" />
              )}
              <span className={`text-[14px] ${m.achieved ? 'text-text-primary dark:text-text-darkPri' : 'text-text-secondary'}`}>
                {m.title}
              </span>
            </div>
            <div className="text-[12px] font-mono text-text-secondary whitespace-nowrap ml-4">
              {m.achieved ? (m.date ? formatDate(m.date) : '') : 'not yet'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
