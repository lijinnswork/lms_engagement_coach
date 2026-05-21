import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../stores/authStore';

const COLORS = [
  '#7B9EA8', // Sage Blue
  '#E8A87C', // Warm Peach
  '#B4C7B8', // Soft Mint
  '#D4C5B9', // Soft Sand
  '#9B8EC4', // Muted Lavender
  '#E6B89C', // Light Terracotta
  '#82B5A5', // Seafoam
  '#C4A882', // Warm Tan
];

export const CourseCardsTabs = () => {
  const [activeTab, setActiveTab] = useState<'in_progress' | 'completed'>('in_progress');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetchWithAuth('/api/courses');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((d: any, idx: number) => {
            const progressObj = typeof d.progress === 'object' && d.progress !== null ? d.progress : {};
            const progressPercent = progressObj.progress_percent ?? d.progress_percent ?? 0;
            const completedItems = progressObj.completed_items ?? d.items_completed ?? 0;
            const totalItems = progressObj.total_items ?? d.total_items ?? 10;
            const lastActivity = progressObj.last_activity_at ?? d.last_activity_time ?? null;
            const name = d.course_name || d.name || 'Untitled Course';

            return {
              id: d.course_id || d.id,
              name: name,
              modulesComplete: completedItems,
              modulesTotal: totalItems,
              progress: progressPercent,
              color: COLORS[idx % COLORS.length],
              iconType: idx % 3 === 0 ? 'code' : idx % 3 === 1 ? 'grid' : 'monitor',
              completed_at: lastActivity ? `Completed on ${new Date(lastActivity).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}` : 'Completed'
            };
          });
          setCourses(mapped);
        }
      } catch (e) {
        console.error('Error fetching courses in Tabs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const completedCourses = courses.filter(c => c.progress === 100);
  const inProgressCourses = courses.filter(c => c.progress < 100);

  const renderCard = (course: any, isCompleted: boolean) => (
    <div 
      key={course.id}
      onClick={() => navigate(`/course/${course.id}`)}
      className="flex-shrink-0 w-[240px] p-5 rounded-2xl bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark cursor-pointer hover:shadow-md hover:border-accent-primary transition-all relative overflow-hidden group"
    >
      {isCompleted && (
        <div className="absolute top-4 right-4 text-green-500 bg-white dark:bg-transparent rounded-full">
          <CheckCircle size={24} />
        </div>
      )}
      
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-white"
        style={{ backgroundColor: course.color }}
      >
        <span className="text-[18px] font-bold">{(course.name || '').charAt(0)}</span>
      </div>
      
      <h3 className="text-[16px] font-bold text-text-primary dark:text-text-darkPri mb-1 line-clamp-2 min-h-[48px]">
        {course.name}
      </h3>
      
      <div className="text-[13px] text-text-secondary mb-4">
        {isCompleted ? course.completed_at : `${course.modulesComplete} of ${course.modulesTotal} modules`}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full" 
            style={{ 
              width: `${course.progress}%`,
              backgroundColor: isCompleted ? '#B4C7B8' : course.color 
            }} 
          />
        </div>
        <span className="text-[13px] font-bold text-text-primary dark:text-text-darkPri">
          {course.progress}%
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full h-[180px] bg-bg-secondary dark:bg-bg-darkCard animate-pulse rounded-2xl" />
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-6 border-b border-border-light dark:border-border-dark mb-6">
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`pb-2 text-[15px] font-medium transition-colors relative ${activeTab === 'in_progress' ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          In Progress ({inProgressCourses.length})
          {activeTab === 'in_progress' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 text-[15px] font-medium transition-colors relative ${activeTab === 'completed' ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Completed ({completedCourses.length})
          {activeTab === 'completed' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
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
          className="flex overflow-x-auto gap-4 pb-4 hidden-scrollbar"
        >
          {activeTab === 'in_progress' ? (
            inProgressCourses.length > 0 ? (
              inProgressCourses.map(c => renderCard(c, false))
            ) : (
              <div className="text-text-secondary p-4">No courses in progress.</div>
            )
          ) : (
            completedCourses.length > 0 ? (
              completedCourses.map(c => renderCard(c, true))
            ) : (
              <div className="text-text-secondary p-4">No courses completed yet — keep going!</div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

