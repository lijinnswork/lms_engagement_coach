import { useEffect, useMemo } from 'react';
import { CourseCard } from './CourseCard';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useDashboardStore } from '../../store/dashboardStore';

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

export const CoursesRow = () => {
  const breakpoint = useBreakpoint();
  const { courses: rawCourses, coursesLoading, fetchCourses } = useDashboardStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const courses = useMemo(() => {
    if (!rawCourses) return [];
    return rawCourses.map((d: any, idx: number) => {
      const progressObj = typeof d.progress === 'object' && d.progress !== null ? d.progress : {};
      const progressPercent = progressObj.progress_percent ?? d.progress_percent ?? 0;
      const completedItems = progressObj.completed_items ?? d.items_completed ?? 0;
      const totalItems = progressObj.total_items ?? d.total_items ?? 10;
      const name = d.course_name || d.name || 'Untitled Course';

      return {
        id: d.course_id || d.id,
        name: name,
        modulesComplete: completedItems,
        modulesTotal: totalItems,
        progress: progressPercent,
        color: COLORS[idx % COLORS.length],
        iconType: idx % 3 === 0 ? 'code' : idx % 3 === 1 ? 'grid' : 'monitor'
      };
    });
  }, [rawCourses]);

  if (coursesLoading && !rawCourses) {
    return (
      <div className="flex gap-4 mt-2 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-[140px] h-[130px] rounded-xl bg-bg-secondary dark:bg-bg-darkCard animate-pulse" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-sm text-text-secondary dark:text-text-darkSec py-4">
        No courses connected. Please link your Open edX account in Settings.
      </div>
    );
  }

  if (breakpoint === 'desktop') {
    return (
      <div className="flex flex-wrap gap-4 mt-2">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    );
  }

  // Mobile and Tablet - Horizontal scroll, hide scrollbar via CSS class
  return (
    <div className="flex overflow-x-auto gap-4 mt-2 pb-4 -mx-6 px-6 no-scrollbar">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

