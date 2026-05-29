import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../../store/dashboardStore';


// Ensure the type matches what might come from the API or mock
export interface CourseProgressData {
  id: string;
  name: string;
  progress_percent: number;
  total_items: number;
  items_completed: number;
  enrollment_active?: boolean;
}

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
const OTHERS_COLOR = '#8B92A5'; // Muted Gray

export const StackedProgressBar = () => {
  const navigate = useNavigate();
  const { courses: rawCourses, coursesLoading, fetchCourses } = useDashboardStore();
  
  // Animation state
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [barReady, setBarReady] = useState(false);

  // Hover state
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const courses = React.useMemo(() => {
    if (!rawCourses) return [];
    return rawCourses.map((d: any) => {
      const progressObj = typeof d.progress === 'object' && d.progress !== null ? d.progress : {};
      const progressPercent = progressObj.progress_percent ?? d.progress_percent ?? 0;
      const completedItems = progressObj.completed_items ?? d.items_completed ?? 0;
      const totalItems = progressObj.total_items ?? d.total_items ?? 10;
      
      return {
        id: d.course_id || d.id,
        name: d.course_name || d.name,
        progress_percent: progressPercent,
        total_items: totalItems,
        items_completed: completedItems,
        enrollment_active: d.enrollment_active ?? true,
      };
    });
  }, [rawCourses]);

  // Process data
  const activeCourses = courses.filter(c => (c.enrollment_active !== false) && c.progress_percent < 100);
  
  // Sort descending by progress
  const sortedCourses = [...activeCourses].sort((a, b) => b.progress_percent - a.progress_percent);
  
  const topCourses = sortedCourses.slice(0, 8);
  const otherCourses = sortedCourses.slice(8);
  
  const totalActiveCount = activeCourses.length;
  
  // Overall calculation
  const sumProgress = activeCourses.reduce((sum, c) => sum + c.progress_percent, 0);
  const overallProgress = totalActiveCount > 0 ? Math.round(sumProgress / totalActiveCount) : 0;

  useEffect(() => {
    if (!coursesLoading && rawCourses) {
      setTimeout(() => setBarReady(true), 100);
      
      // Animate the overall percentage number
      let start = 0;
      const duration = 600;
      const startTime = performance.now();
      
      const animateNum = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setAnimatedProgress(Math.round(easeOut * overallProgress));
        
        if (progress < 1) {
          requestAnimationFrame(animateNum);
        }
      };
      requestAnimationFrame(animateNum);
    }
  }, [coursesLoading, rawCourses, overallProgress]);

  if (coursesLoading && !rawCourses) {
    return (
      <div className="w-full flex justify-center items-center py-6">
        <div className="w-6 h-6 border-2 border-accent-sage border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state: 0 enrolled
  if (courses.length === 0) {
    return (
      <div className="w-full py-6 text-center text-text-secondary text-[14px]">
        Enroll in a course to track your progress here
      </div>
    );
  }

  // 0 active (all completed)
  if (totalActiveCount === 0) {
    return (
      <div className="w-full py-6 text-center text-accent-sage font-medium text-[15px]">
        🎉 All your courses are complete!
      </div>
    );
  }

  // Handle hover interactions
  const handleMouseMove = (e: React.MouseEvent, id: string) => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      // Center of cursor relative to bar horizontally, just above the bar vertically
      setTooltipPos({
        x: e.clientX - rect.left,
        y: -16 // 16px above the bar
      });
    }
    setHoveredSegment(id);
  };

  const handleClick = (id: string) => {
    if (id === 'others') {
      // Optional: scroll down or do nothing
    } else {
      navigate(`/course/${id}`);
    }
  };

  const renderHoverCard = () => {
    if (!hoveredSegment) return null;

    if (hoveredSegment === 'others') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-bg-secondary dark:bg-bg-tertiary border border-border-light dark:border-border-dark rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] w-[240px]">
            <div className="font-sans text-[14px] font-bold text-text-primary dark:text-text-darkPri mb-2">
              +{otherCourses.length} other courses
            </div>
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-hidden">
              {otherCourses.slice(0, 10).map(c => (
                <div key={c.id} className="flex justify-between items-center text-[12px]">
                  <span className="text-text-secondary truncate pr-2">{c.name}</span>
                  <span className="font-mono text-text-primary dark:text-text-darkPri">{c.progress_percent}%</span>
                </div>
              ))}
              {otherCourses.length > 10 && (
                <div className="text-[12px] text-text-secondary italic mt-1">
                  and {otherCourses.length - 10} more...
                </div>
              )}
            </div>
            {/* Triangle pointer */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-bg-secondary dark:bg-bg-tertiary border-r border-b border-border-light dark:border-border-dark rotate-45"></div>
          </div>
        </motion.div>
      );
    }

    const course = topCourses.find(c => c.id === hoveredSegment);
    if (!course) return null;
    
    const colorIndex = topCourses.findIndex(c => c.id === hoveredSegment);
    const color = COLORS[colorIndex] || COLORS[0];

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        <div className="bg-bg-secondary dark:bg-bg-tertiary border border-border-light dark:border-border-dark rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] min-w-[200px] max-w-[240px]">
          <div className="font-sans text-[14px] font-bold text-text-primary dark:text-text-darkPri mb-3 line-clamp-2 leading-tight">
            {course.name}
          </div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex-1 h-1 bg-border-light dark:bg-[#3A3F4D] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${course.progress_percent}%`, backgroundColor: color }} />
            </div>
            <div className="font-mono text-[14px] text-text-primary dark:text-text-darkPri font-medium">
              {course.progress_percent}%
            </div>
          </div>
          <div className="text-[12px] text-text-secondary">
            {course.items_completed} of {course.total_items} items
          </div>
          {/* Triangle pointer */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-bg-secondary dark:bg-bg-tertiary border-r border-b border-border-light dark:border-border-dark rotate-45"></div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full mb-6 relative">
      {/* Title block is handled by DesktopLayout "Your courses", so we just show the bar */}
      
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
        <div 
          className="flex-1 relative" 
          ref={barRef}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          {/* Hover Card */}
          <AnimatePresence>
            {renderHoverCard()}
          </AnimatePresence>

          <div className="w-full h-3 md:h-4 bg-border-light dark:bg-[#3A3F4D] rounded-full flex items-center relative">
            {topCourses.map((course, idx) => {
              // width % = course_progress / total_possible
              // where total_possible = 100 * active_courses_count
              const widthPercent = totalActiveCount > 0 ? (course.progress_percent / totalActiveCount) : 0;
              // Minimum 8px logic can be tricky with percentages, but we can ensure a min-width in css
              // Or calculate dynamic minWidth
              const isHovered = hoveredSegment === course.id;
              const isOtherHovered = hoveredSegment !== null && hoveredSegment !== course.id;

              return (
                <motion.div
                  key={course.id}
                  className={`cursor-pointer transition-all duration-300 origin-center ${isHovered ? 'h-[140%] rounded-md z-10 shadow-md' : 'h-full z-0'} ${isOtherHovered ? 'opacity-60' : 'opacity-100'} ${idx === 0 && !isHovered ? 'rounded-l-full' : ''}`}
                  style={{ 
                    backgroundColor: COLORS[idx] || COLORS[0],
                    minWidth: course.progress_percent > 0 ? '8px' : '0px'
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: barReady ? `${widthPercent}%` : '0%' }}
                  transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
                  onMouseMove={(e) => handleMouseMove(e, course.id)}
                  onClick={() => handleClick(course.id)}
                />
              );
            })}
            
            {otherCourses.length > 0 && (
              <motion.div
                className={`cursor-pointer transition-all duration-300 origin-center ${(hoveredSegment === 'others') ? 'h-[140%] rounded-md z-10 shadow-md' : 'h-full z-0'} ${(hoveredSegment !== null && hoveredSegment !== 'others') ? 'opacity-60' : 'opacity-100'}`}
                style={{ 
                  backgroundColor: OTHERS_COLOR,
                  minWidth: sumProgress > 0 ? '8px' : '0px' 
                }}
                initial={{ width: '0%' }}
                animate={{ width: barReady ? `${otherCourses.reduce((sum, c) => sum + c.progress_percent, 0) / totalActiveCount}%` : '0%' }}
                transition={{ duration: 0.4, delay: topCourses.length * 0.1, ease: 'easeOut' }}
                onMouseMove={(e) => handleMouseMove(e, 'others')}
                onClick={() => handleClick('others')}
              />
            )}
          </div>
        </div>

        <div className="text-center md:w-[140px] shrink-0 font-mono text-[14px] font-bold text-text-primary dark:text-text-darkPri self-center">
          {animatedProgress}% <span className="font-sans text-text-secondary font-normal">overall</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {topCourses.map((course, idx) => (
          <div 
            key={course.id} 
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${hoveredSegment && hoveredSegment !== course.id ? 'opacity-60' : 'opacity-100 hover:opacity-80'}`}
            onMouseEnter={() => setHoveredSegment(course.id)}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => handleClick(course.id)}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx] || COLORS[0] }} />
            <span className="font-sans text-[12px] text-text-secondary line-clamp-1">{course.name}</span>
          </div>
        ))}
        {otherCourses.length > 0 && (
          <div 
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${hoveredSegment && hoveredSegment !== 'others' ? 'opacity-60' : 'opacity-100 hover:opacity-80'}`}
            onMouseEnter={() => setHoveredSegment('others')}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => handleClick('others')}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: OTHERS_COLOR }} />
            <span className="font-sans text-[12px] text-text-secondary line-clamp-1">Others ({otherCourses.length} courses)</span>
          </div>
        )}
      </div>
    </div>
  );
};
